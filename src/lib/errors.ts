import { APICallError, RetryError } from "ai";
import { TOO_MANY } from "./rateLimit";

export const OFFLINE = "You're offline. Reconnect and try again.";
export const BUSY = "The AI is busy (free-tier limit). Wait a minute and retry.";
export const OVERLOADED = "The AI model is overloaded right now. Try again in a moment.";
export const TIMEOUT = "This is taking too long. Retry?";
export const NETWORK =
  "The connection dropped before the tour finished. Check your network and retry.";
export const MALFORMED = "The AI returned the tour in the wrong format.";
export const GENERIC = "The AI model couldn't respond. Try again.";

/**
 * Maps any failure in the tour flow to a message safe to show users.
 * Runs on the server (provider errors) and the client (transport errors, tool errorText).
 */
export function userMessage(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error;

  if (APICallError.isInstance(cause)) {
    // Our own per-IP limit: its body already says how long to wait.
    if (cause.statusCode === 429 && cause.message.startsWith(TOO_MANY)) return cause.message;
    if (cause.statusCode === 429) return BUSY;
    if (cause.statusCode === 503) return OVERLOADED;
    if (cause.statusCode === 408 || cause.statusCode === 504) return TIMEOUT;
  }
  if (cause instanceof Error && cause.name === "TimeoutError") return TIMEOUT;
  if (cause instanceof TypeError && /fetch|network|load failed|terminated/i.test(cause.message)) {
    return NETWORK;
  }

  const raw = typeof cause === "string" ? cause : cause instanceof Error ? cause.message : "";
  // The SDK stringifies thrown Errors, so tool errorText arrives as "Error: <message>".
  const text = raw.replace(/^Error: /, "").trim();
  if (/quota|rate.?limit/i.test(text) && !text.startsWith("GitHub")) return BUSY;
  if (text.startsWith("Invalid input for tool")) return MALFORMED;
  // Our own server and tool messages are short plain sentences; anything else (an HTML 500 page,
  // a stack trace) is not something to show.
  if (text && text.length <= 200 && !text.includes("<")) return text;
  return GENERIC;
}
