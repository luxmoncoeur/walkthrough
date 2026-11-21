import { describe, expect, it } from "vitest";
import { fileQuerySchema } from "./schemas";

const base = { owner: "vercel", repo: "ms", ref: "main", path: "src/index.ts" };

describe("fileQuerySchema", () => {
  const accepted: [string, Partial<typeof base>][] = [
    ["a root file", { path: "README.md" }],
    ["a nested file", { path: "packages/next/src/bin/next.ts" }],
    ["a file name with spaces", { path: "docs/My Notes.md" }],
    ["a dotfile", { path: ".github/workflows/ci.yml" }],
    ["a branch with slashes", { ref: "release/v2" }],
  ];

  const rejected: [string, Partial<typeof base>][] = [
    ["an empty path", { path: "" }],
    ["a leading slash", { path: "/etc/passwd" }],
    ["a trailing slash", { path: "src/" }],
    ["a parent segment", { path: "../secrets" }],
    ["a nested parent segment", { path: "src/../../x" }],
    ["a dot segment", { path: "./src/index.ts" }],
    ["a double slash", { path: "src//index.ts" }],
    ["a path over 1000 chars", { path: "a".repeat(1001) }],
    ["an empty ref", { ref: "" }],
    ["a ref with a space", { ref: "main branch" }],
    ["a ref with a parent segment", { ref: "../main" }],
    ["an invalid owner", { owner: "-vercel" }],
    ["an invalid repo", { repo: ".." }],
  ];

  it.each(accepted)("accepts %s", (_, override) => {
    expect(fileQuerySchema.safeParse({ ...base, ...override }).success).toBe(true);
  });

  it.each(rejected)("rejects %s", (_, override) => {
    expect(fileQuerySchema.safeParse({ ...base, ...override }).success).toBe(false);
  });

  it("rejects a missing path", () => {
    expect(fileQuerySchema.safeParse({ owner: "vercel", repo: "ms", ref: "main" }).success).toBe(
      false,
    );
  });
});
