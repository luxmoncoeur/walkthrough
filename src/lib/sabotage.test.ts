import { describe, expect, it } from "vitest";
import { sabotageMode } from "./sabotage";

describe("sabotageMode", () => {
  const rows: [string, string | undefined, unknown, string | null][] = [
    ["env unset", undefined, "429", null],
    ["env empty", "", "midstream", null],
    ["env 0", "0", "slow", null],
    ["env true (not 1)", "true", "malformed", null],
    ["env 1, midstream", "1", "midstream", "midstream"],
    ["env 1, 429", "1", "429", "429"],
    ["env 1, malformed", "1", "malformed", "malformed"],
    ["env 1, slow", "1", "slow", "slow"],
    ["env 1, unknown mode", "1", "explode", null],
    ["env 1, number 429", "1", 429, null],
    ["env 1, missing", "1", undefined, null],
  ];

  it.each(rows)("%s", (_, ENABLE_SABOTAGE, value, expected) => {
    expect(sabotageMode(value, ENABLE_SABOTAGE)).toBe(expected);
  });
});
