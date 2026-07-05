package com.aibuilder.ai;

import com.aibuilder.config.AiBuilderConfig;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Calls the Anthropic Messages API directly over HTTPS (java.net.http),
 * for players who configure an API key instead of using Claude Code.
 */
public class AnthropicApiBackend implements AiBackend {
	private static final String ENDPOINT = "https://api.anthropic.com/v1/messages";
	private static final String API_VERSION = "2023-06-01";

	private final AiBuilderConfig config;
	private final HttpClient client;

	public AnthropicApiBackend(AiBuilderConfig config) {
		this.config = config;
		this.client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
	}

	@Override
	public GenResult generate(String request, String previousError) throws BackendException, InterruptedException {
		String apiKey = config.resolvedApiKey();
		if (apiKey.isBlank()) {
			throw new BackendException("backend is \"api\" but no API key is set. Put your key in \"apiKey\" in "
					+ "config/aibuilder.json (or set the ANTHROPIC_API_KEY environment variable).");
		}

		JsonObject body = new JsonObject();
		body.addProperty("model", config.apiModel == null || config.apiModel.isBlank()
				? "claude-opus-4-8" : config.apiModel);
		body.addProperty("max_tokens", Math.max(4000, config.apiMaxTokens));
		body.addProperty("system", PromptBuilder.systemPrompt(config));

		JsonArray messages = new JsonArray();
		JsonObject user = new JsonObject();
		user.addProperty("role", "user");
		user.addProperty("content", previousError == null
				? PromptBuilder.userPrompt(request)
				: PromptBuilder.retryPrompt(request, previousError));
		messages.add(user);
		body.add("messages", messages);

		HttpRequest httpRequest = HttpRequest.newBuilder()
				.uri(URI.create(ENDPOINT))
				.timeout(Duration.ofSeconds(config.timeoutSeconds))
				.header("x-api-key", apiKey)
				.header("anthropic-version", API_VERSION)
				.header("content-type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
				.build();

		HttpResponse<String> response = send(httpRequest, true);
		return parseResponse(response);
	}

	private HttpResponse<String> send(HttpRequest request, boolean allowRetry)
			throws BackendException, InterruptedException {
		HttpResponse<String> response;
		try {
			response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
		} catch (InterruptedException e) {
			throw e;
		} catch (java.net.http.HttpTimeoutException e) {
			throw new BackendException("The AI took longer than " + config.timeoutSeconds
					+ "s. Try a simpler request or raise \"timeoutSeconds\" in config/aibuilder.json.");
		} catch (Exception e) {
			throw new BackendException("Couldn't reach the Anthropic API. Check your internet connection.", e);
		}

		int status = response.statusCode();
		if (status == 429 || status == 529 || status >= 500) {
			if (allowRetry) {
				long waitSeconds = response.headers().firstValueAsLong("retry-after").orElse(5);
				Thread.sleep(Math.min(waitSeconds, 30) * 1000L);
				return send(request, false);
			}
			throw new BackendException(status == 429
					? "The Anthropic API rate-limited this key. Wait a minute and try again."
					: "The Anthropic API is overloaded right now. Try again shortly.");
		}
		if (status == 401) {
			throw new BackendException("The Anthropic API rejected your API key. Check \"apiKey\" in config/aibuilder.json.");
		}
		if (status != 200) {
			throw new BackendException("Anthropic API error (HTTP " + status + "): " + truncate(response.body(), 200));
		}
		return response;
	}

	private static GenResult parseResponse(HttpResponse<String> response) throws BackendException {
		try {
			JsonObject root = JsonParser.parseString(response.body()).getAsJsonObject();
			String stopReason = root.has("stop_reason") && !root.get("stop_reason").isJsonNull()
					? root.get("stop_reason").getAsString() : "";
			if (stopReason.equals("refusal")) {
				throw new BackendException("The AI declined this request. Try phrasing the build differently.");
			}
			if (stopReason.equals("max_tokens")) {
				throw new BackendException("The design was too large to finish. Ask for something smaller or simpler.");
			}
			long tokens = 0;
			if (root.has("usage") && root.get("usage").isJsonObject()) {
				JsonObject usage = root.getAsJsonObject("usage");
				for (String field : new String[]{"input_tokens", "output_tokens", "cache_creation_input_tokens"}) {
					if (usage.has(field) && usage.get(field).isJsonPrimitive()) {
						tokens += usage.get(field).getAsLong();
					}
				}
			}
			JsonArray content = root.getAsJsonArray("content");
			for (var element : content) {
				JsonObject block = element.getAsJsonObject();
				if (block.get("type").getAsString().equals("text")) {
					return new GenResult(block.get("text").getAsString(), tokens);
				}
			}
			throw new BackendException("The AI returned no text.");
		} catch (BackendException e) {
			throw e;
		} catch (Exception e) {
			throw new BackendException("Couldn't parse the Anthropic API response.", e);
		}
	}

	private static String truncate(String text, int max) {
		String trimmed = text == null ? "" : text.trim();
		return trimmed.length() > max ? trimmed.substring(0, max) + "..." : trimmed;
	}
}
