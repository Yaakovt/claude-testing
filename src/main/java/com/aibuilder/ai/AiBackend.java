package com.aibuilder.ai;

/**
 * A source of build-plan JSON. Implementations run on a background thread;
 * generate() blocks until the AI responds or fails.
 */
public interface AiBackend {

	class BackendException extends Exception {
		public BackendException(String userFriendlyMessage) {
			super(userFriendlyMessage);
		}

		public BackendException(String userFriendlyMessage, Throwable cause) {
			super(userFriendlyMessage, cause);
		}
	}

	/**
	 * @param request       what the player asked to build
	 * @param previousError if retrying after a malformed plan, the parse error; else null
	 * @return the raw text of the AI's reply (expected to contain the plan JSON)
	 */
	String generate(String request, String previousError) throws BackendException, InterruptedException;

	/** Best-effort abort of an in-flight generation (kills the CLI process, etc.). */
	default void cancel() {
	}
}
