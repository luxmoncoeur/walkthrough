import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { BUSY, GENERIC, MALFORMED, NETWORK, OVERLOADED, TIMEOUT, userMessage } from "./errors";

const apiError = (statusCode: number, message = "Request failed") =>
  new APICallError({ message, url: "https://api.example", requestBodyValues: {}, statusCode });
const named = (name: string, message = "x") => Object.assign(new Error(message), { name });
const CONFIG =
  "The AI provider isn't configured. Set GROQ_API_KEY in .env.local and restart the server.";

describe("userMessage", () => {
  const rows: [string, unknown, string][] = [
    ["provider 429", apiError(429), BUSY],
    ["429 wrapped in RetryError", new RetryError({ message: "x", reason: "maxRetriesExceeded", errors: [apiError(500), apiError(429)] }), BUSY],
    ["quota text without a status", new Error("You exceeded your current quota"), BUSY],
    ["rate limit text without a status", "Error: Rate limit reached for model", BUSY],
    ["503", apiError(503), OVERLOADED],
    ["504", apiError(504), TIMEOUT],
    ["408", apiError(408), TIMEOUT],
    ["TimeoutError", named("TimeoutError"), TIMEOUT],
    ["Chrome network drop", new TypeError("network error"), NETWORK],
    ["Chrome fetch failure", new TypeError("Failed to fetch"), NETWORK],
    ["Safari network drop", new TypeError("Load failed"), NETWORK],
    ["Node stream cut", new TypeError("terminated"), NETWORK],
    ["unrelated TypeError", new TypeError("x is not a function"), "x is not a function"],
    ["missing key (500 body)", apiError(500, CONFIG), CONFIG],
    ["tool errorText with Error: prefix", "Error: Repository not found or private.", "Repository not found or private."],
    ["GitHub rate limit stays GitHub's", "Error: GitHub rate limit reached. Try again after 14:05.", "GitHub rate limit reached. Try again after 14:05."],
    ["zod tool input failure", "Invalid input for tool planTour: Type validation failed: ...", MALFORMED],
    ["HTML error page", apiError(500, "<!DOCTYPE html><html>…</html>"), GENERIC],
    ["very long message", "a".repeat(201), GENERIC],
    ["empty string", "", GENERIC],
    ["non-error value", { weird: true }, GENERIC],
    ["undefined", undefined, GENERIC],
  ];

  it.each(rows)("%s", (_, input, expected) => {
    expect(userMessage(input)).toBe(expected);
  });
});
