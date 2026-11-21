import { describe, expect, it } from "vitest";
import { sabotageMode } from "./sabotage";

const dev = { NODE_ENV: "development" };

describe("sabotageMode", () => {
  const rows: [string, Record<string, string | undefined>, unknown, string | null][] = [
    ["env unset", { ...dev }, "429", null],
    ["env empty", { ...dev, ENABLE_SABOTAGE: "" }, "midstream", null],
    ["env 0", { ...dev, ENABLE_SABOTAGE: "0" }, "slow", null],
    ["env true (not 1)", { ...dev, ENABLE_SABOTAGE: "true" }, "malformed", null],
    ["env 1, midstream", { ...dev, ENABLE_SABOTAGE: "1" }, "midstream", "midstream"],
    ["env 1, 429", { ...dev, ENABLE_SABOTAGE: "1" }, "429", "429"],
    ["env 1, malformed", { ...dev, ENABLE_SABOTAGE: "1" }, "malformed", "malformed"],
    ["env 1, slow", { ...dev, ENABLE_SABOTAGE: "1" }, "slow", "slow"],
    ["env 1, unknown mode", { ...dev, ENABLE_SABOTAGE: "1" }, "explode", null],
    ["env 1, number 429", { ...dev, ENABLE_SABOTAGE: "1" }, 429, null],
    ["env 1, missing", { ...dev, ENABLE_SABOTAGE: "1" }, undefined, null],
    ["Vercel Preview", { ENABLE_SABOTAGE: "1", NODE_ENV: "production", VERCEL_ENV: "preview" }, "429", "429"],
    ["Vercel Production", { ENABLE_SABOTAGE: "1", NODE_ENV: "production", VERCEL_ENV: "production" }, "429", null],
    ["Vercel Production, NODE_ENV unset", { ENABLE_SABOTAGE: "1", VERCEL_ENV: "production" }, "429", null],
    ["production build off Vercel (npm start)", { ENABLE_SABOTAGE: "1", NODE_ENV: "production" }, "429", null],
  ];

  it.each(rows)("%s", (_, env, value, expected) => {
    expect(sabotageMode(value, env)).toBe(expected);
  });
});
