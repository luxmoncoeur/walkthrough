import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter, rateLimit, TOO_MANY } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows `limit` hits per window, then returns seconds until reset", () => {
    const hit = createRateLimiter(3, 60_000);
    expect([hit("a", 0), hit("a", 1_000), hit("a", 2_000)]).toEqual([0, 0, 0]);
    expect(hit("a", 2_000)).toBe(58);
    expect(hit("a", 59_001)).toBe(1);
  });

  it("resets when the window ends", () => {
    const hit = createRateLimiter(1, 60_000);
    expect(hit("a", 0)).toBe(0);
    expect(hit("a", 59_999)).toBe(1);
    expect(hit("a", 60_000)).toBe(0);
    expect(hit("a", 60_001)).toBe(60);
  });

  it("counts each IP separately", () => {
    const hit = createRateLimiter(1, 60_000);
    expect(hit("1.1.1.1", 0)).toBe(0);
    expect(hit("1.1.1.1", 0)).toBe(60);
    expect(hit("2.2.2.2", 0)).toBe(0);
  });
});

describe("clientIp", () => {
  const rows: [string, string | null, string][] = [
    ["single", "203.0.113.5", "203.0.113.5"],
    ["first of a list", "203.0.113.5, 10.0.0.1", "203.0.113.5"],
    ["missing", null, "unknown"],
    ["empty", "", "unknown"],
  ];
  it.each(rows)("%s", (_, header, expected) => {
    const headers = new Headers(header === null ? {} : { "x-forwarded-for": header });
    expect(clientIp(headers)).toBe(expected);
  });
});

describe("rateLimit", () => {
  it("returns null while allowed, then a 429 with Retry-After and a plain message", async () => {
    const limiter = createRateLimiter(1, 10 * 60_000);
    const req = () => new Request("http://x/api", { headers: { "x-forwarded-for": "9.9.9.9" } });
    expect(rateLimit(req(), limiter)).toBeNull();
    const res = rateLimit(req(), limiter)!;
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("600");
    expect(await res.text()).toBe(`${TOO_MANY} Try again in 10 minutes.`);
  });
});
