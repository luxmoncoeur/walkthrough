import { describe, expect, it } from "vitest";
import { MAX_STEPS, keepKnownPaths, planInputSchema } from "./planTour";

const step = (path: string) => ({ path, reason: `why ${path}` });

describe("keepKnownPaths", () => {
  const files = ["README.md", "src/index.ts", "src/server.ts"];

  it("keeps known paths in the model's order", () => {
    expect(keepKnownPaths([step("src/server.ts"), step("README.md")], files)).toEqual([
      step("src/server.ts"),
      step("README.md"),
    ]);
  });

  it("drops invented paths", () => {
    expect(keepKnownPaths([step("src/made-up.ts"), step("src/index.ts")], files)).toEqual([
      step("src/index.ts"),
    ]);
  });

  it("drops near-misses: paths must match exactly", () => {
    expect(keepKnownPaths([step("/src/index.ts"), step("readme.md"), step("src/")], files)).toEqual(
      [],
    );
  });

  it("drops duplicates, keeping the first", () => {
    const result = keepKnownPaths(
      [step("README.md"), { path: "README.md", reason: "again" }],
      files,
    );
    expect(result).toEqual([step("README.md")]);
  });

  it(`caps at ${MAX_STEPS}`, () => {
    const many = Array.from({ length: 12 }, (_, i) => `f${i}.ts`);
    expect(keepKnownPaths(many.map(step), many)).toHaveLength(MAX_STEPS);
  });
});

describe("planInputSchema", () => {
  it("rejects an empty plan and more than MAX_STEPS steps", () => {
    expect(planInputSchema.safeParse({ steps: [] }).success).toBe(false);
    const tooMany = Array.from({ length: MAX_STEPS + 1 }, (_, i) => step(`f${i}.ts`));
    expect(planInputSchema.safeParse({ steps: tooMany }).success).toBe(false);
  });
});
