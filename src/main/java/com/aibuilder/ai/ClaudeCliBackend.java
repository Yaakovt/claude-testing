package com.aibuilder.ai;

import com.aibuilder.config.AiBuilderConfig;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * Runs the locally installed Claude Code CLI in headless print mode
 * ("claude -p --output-format json"), using the player's Claude subscription.
 * The prompt is written to stdin to avoid Windows command-line quoting limits.
 */
public class ClaudeCliBackend implements AiBackend {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");

	private final AiBuilderConfig config;
	private volatile Process currentProcess;
	private volatile List<String> cachedCommand;

	public ClaudeCliBackend(AiBuilderConfig config) {
		this.config = config;
	}

	@Override
	public GenResult generate(String request, String previousError) throws BackendException, InterruptedException {
		List<String> base = findClaude();
		String prompt = PromptBuilder.cliPrompt(config, request, previousError);

		// Full flags make the call truly non-interactive and fast:
		//  --bare              skip auto-discovery of MCP servers / hooks / plugins (the usual hang)
		//  --permission-mode dontAsk   never block waiting for a permission prompt
		//  --allowedTools ""   let the model answer directly with no tools
		// If an older CLI rejects any of these, we retry once with the minimal set.
		try {
			return runOnce(buildCommand(base, true), prompt);
		} catch (UnknownFlagException e) {
			LOGGER.warn("Claude CLI rejected an option ({}); retrying with minimal flags", e.getMessage());
			try {
				return runOnce(buildCommand(base, false), prompt);
			} catch (UnknownFlagException e2) {
				throw new BackendException("Claude Code rejected the command options: " + e2.getMessage());
			}
		}
	}

	private List<String> buildCommand(List<String> base, boolean fullFlags) {
		List<String> command = new ArrayList<>(base);
		command.add("-p");
		command.add("--output-format");
		command.add("json");
		if (fullFlags) {
			command.add("--bare");
			command.add("--permission-mode");
			command.add("dontAsk");
			command.add("--allowedTools");
			command.add("");
		}
		if (config.cliModel != null && !config.cliModel.isBlank()) {
			command.add("--model");
			command.add(config.cliModel);
		}
		return command;
	}

	/** Thrown when the CLI reports an unrecognized option, so we can retry with fewer flags. */
	private static class UnknownFlagException extends Exception {
		UnknownFlagException(String message) {
			super(message);
		}
	}

	private GenResult runOnce(List<String> command, String prompt)
			throws BackendException, InterruptedException, UnknownFlagException {
		ProcessBuilder builder = new ProcessBuilder(command);
		builder.redirectErrorStream(false);
		Process process;
		try {
			process = builder.start();
		} catch (IOException e) {
			cachedCommand = null;
			throw new BackendException("Couldn't start Claude Code (" + String.join(" ", command)
					+ "). Is it installed? See the README, or set \"claudePath\" in config/aibuilder.json.", e);
		}
		currentProcess = process;

		try {
			try (OutputStream stdin = process.getOutputStream()) {
				stdin.write(prompt.getBytes(StandardCharsets.UTF_8));
			} catch (IOException e) {
				// Process may have died instantly; fall through to read stderr below.
			}

			StringBuilder stdout = new StringBuilder();
			StringBuilder stderr = new StringBuilder();
			Thread outReader = readerThread(process.getInputStream(), stdout);
			Thread errReader = readerThread(process.getErrorStream(), stderr);
			outReader.start();
			errReader.start();

			boolean finished = process.waitFor(config.timeoutSeconds, TimeUnit.SECONDS);
			if (!finished) {
				killTree(process);
				throw new BackendException("The AI took longer than " + config.timeoutSeconds
						+ "s to design this. Try a simpler request, or raise \"timeoutSeconds\" in config/aibuilder.json.");
			}
			outReader.join(5000);
			errReader.join(5000);

			int exit = process.exitValue();
			String err = stderr.toString();
			if (exit != 0) {
				String lower = (err + "\n" + stdout).toLowerCase(Locale.ROOT);
				if (lower.contains("unknown option") || lower.contains("unrecognized")
						|| lower.contains("unknown argument") || lower.contains("--bare")
						|| lower.contains("--permission-mode") || lower.contains("--allowedtools")) {
					throw new UnknownFlagException(truncate(err, 120));
				}
				throw new BackendException(friendlyCliError(exit, err, stdout.toString()));
			}
			return extractResult(stdout.toString(), err);
		} finally {
			currentProcess = null;
		}
	}

	@Override
	public void cancel() {
		Process process = currentProcess;
		if (process != null) {
			killTree(process);
		}
	}

	private static void killTree(Process process) {
		process.descendants().forEach(ProcessHandle::destroyForcibly);
		process.destroyForcibly();
	}

	private static Thread readerThread(java.io.InputStream stream, StringBuilder into) {
		Thread thread = new Thread(() -> {
			try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(stream, StandardCharsets.UTF_8))) {
				char[] buffer = new char[8192];
				int n;
				while ((n = reader.read(buffer)) >= 0) {
					synchronized (into) {
						into.append(buffer, 0, n);
					}
				}
			} catch (IOException ignored) {
			}
		}, "aibuilder-cli-reader");
		thread.setDaemon(true);
		return thread;
	}

	/** Parses the CLI's JSON envelope: {"type":"result","subtype":"success","result":"...","is_error":false,...} */
	private static GenResult extractResult(String stdout, String stderr) throws BackendException {
		try {
			JsonObject envelope = JsonParser.parseString(stdout.trim()).getAsJsonObject();
			boolean isError = envelope.has("is_error") && envelope.get("is_error").getAsBoolean();
			String result = envelope.has("result") ? envelope.get("result").getAsString() : null;
			if (isError || result == null) {
				String detail = result != null ? result : stderr;
				throw new BackendException("Claude Code reported an error: " + truncate(detail, 200));
			}
			return new GenResult(result, tokensFromUsage(envelope));
		} catch (BackendException e) {
			throw e;
		} catch (Exception e) {
			// Not the expected envelope; maybe the CLI printed the answer directly.
			if (stdout.contains("{")) {
				return new GenResult(stdout, 0);
			}
			throw new BackendException("Couldn't understand Claude Code's output: " + truncate(stdout + " " + stderr, 200));
		}
	}

	/** Sums the token counts from the envelope's "usage" object, tolerating missing fields. */
	private static long tokensFromUsage(JsonObject envelope) {
		try {
			if (!envelope.has("usage") || !envelope.get("usage").isJsonObject()) {
				return 0;
			}
			JsonObject usage = envelope.getAsJsonObject("usage");
			long total = 0;
			for (String field : new String[]{"input_tokens", "output_tokens", "cache_creation_input_tokens"}) {
				if (usage.has(field) && usage.get(field).isJsonPrimitive()) {
					total += usage.get(field).getAsLong();
				}
			}
			return total;
		} catch (Exception e) {
			return 0;
		}
	}

	private static String friendlyCliError(int exit, String stderr, String stdout) {
		String all = (stderr + "\n" + stdout).toLowerCase(Locale.ROOT);
		if (all.contains("log in") || all.contains("login") || all.contains("authentication")
				|| all.contains("not authenticated") || all.contains("api key")) {
			return "Claude Code isn't logged in. Open a terminal, run \"claude\", and sign in with your Claude account once.";
		}
		if (all.contains("rate limit") || all.contains("usage limit")) {
			return "Your Claude usage limit was reached. Wait a bit and try again.";
		}
		return "Claude Code exited with an error (code " + exit + "): " + truncate(stderr.isBlank() ? stdout : stderr, 200);
	}

	/**
	 * Finds a working claude executable. Tries, in order: the configured path,
	 * "claude" / "claude.exe" on PATH, cmd /c claude (for npm's claude.cmd on Windows),
	 * and the native installer's default location (~/.local/bin).
	 */
	private synchronized List<String> findClaude() throws BackendException {
		if (cachedCommand != null) {
			return cachedCommand;
		}

		List<List<String>> candidates = new ArrayList<>();
		if (config.claudePath != null && !config.claudePath.isBlank()) {
			candidates.add(List.of(config.claudePath));
		}
		boolean windows = System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
		String home = System.getProperty("user.home", "");
		if (windows) {
			candidates.add(List.of("claude.exe"));
			candidates.add(List.of("claude"));
			candidates.add(List.of("cmd", "/c", "claude"));
			Path nativePath = Path.of(home, ".local", "bin", "claude.exe");
			if (Files.exists(nativePath)) {
				candidates.add(List.of(nativePath.toString()));
			}
			String appData = System.getenv("APPDATA");
			if (appData != null && Files.exists(Path.of(appData, "npm", "claude.cmd"))) {
				candidates.add(List.of("cmd", "/c", Path.of(appData, "npm", "claude.cmd").toString()));
			}
		} else {
			candidates.add(List.of("claude"));
			candidates.add(List.of(home + "/.local/bin/claude"));
			candidates.add(List.of("/usr/local/bin/claude"));
		}

		for (List<String> candidate : candidates) {
			if (probe(candidate)) {
				cachedCommand = candidate;
				LOGGER.info("Found Claude Code CLI: {}", String.join(" ", candidate));
				return candidate;
			}
		}
		throw new BackendException("Couldn't find the Claude Code app. Install it (see README) or set \"claudePath\" "
				+ "in config/aibuilder.json to the full path of claude.exe.");
	}

	private static boolean probe(List<String> base) {
		List<String> command = new ArrayList<>(base);
		command.add("--version");
		try {
			Process process = new ProcessBuilder(command)
					.redirectOutput(ProcessBuilder.Redirect.DISCARD)
					.redirectError(ProcessBuilder.Redirect.DISCARD)
					.start();
			if (!process.waitFor(15, TimeUnit.SECONDS)) {
				process.destroyForcibly();
				return false;
			}
			return process.exitValue() == 0;
		} catch (Exception e) {
			return false;
		}
	}

	private static String truncate(String text, int max) {
		String trimmed = text.trim();
		return trimmed.length() > max ? trimmed.substring(0, max) + "..." : trimmed;
	}
}
