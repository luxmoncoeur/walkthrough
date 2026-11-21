import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_REPO, githubErrorMessage } from "../github";
import { MAX_FILES, filterTree, getRepoTree, rank } from "./getRepoTree";

const blob = (path: string) => ({ path, type: "blob" });

describe("filterTree", () => {
  const excluded = [
    "node_modules/react/index.js",
    "packages/a/node_modules/x.js",
    ".git/HEAD",
    "package-lock.json",
    "yarn.lock",
    "apps/web/pnpm-lock.yaml",
    "Cargo.lock",
    "public/logo.png",
    "docs/photo.JPG",
    "icon.svg",
    "fonts/Inter.woff2",
    "assets/font.ttf",
    "dist/app.wasm",
    "release.zip",
    "manual.pdf",
  ];
  const kept = ["README.md", "src/index.ts", ".github/workflows/ci.yml", "package.json"];

  it.each(excluded)("drops %j", (path) => {
    expect(filterTree([blob(path)], false).files).toEqual([]);
  });

  it.each(kept)("keeps %j", (path) => {
    expect(filterTree([blob(path)], false).files).toEqual([path]);
  });

  it("drops directories (tree entries) and counts only kept files", () => {
    const result = filterTree(
      [{ path: "src", type: "tree" }, blob("src/a.ts"), blob("yarn.lock")],
      false,
    );
    expect(result).toEqual({ totalFiles: 1, files: ["src/a.ts"], truncated: false });
  });

  it("caps at MAX_FILES, keeping shallow paths first, and sets truncated", () => {
    const deep = Array.from({ length: MAX_FILES }, (_, i) => blob(`a/b/file${i}.ts`));
    const result = filterTree([...deep, blob("README.md")], false);
    expect(result.totalFiles).toBe(MAX_FILES + 1);
    expect(result.files).toHaveLength(MAX_FILES);
    expect(result.files).toContain("README.md");
    expect(result.truncated).toBe(true);
  });

  it("returns files sorted by path", () => {
    expect(filterTree([blob("src/b.ts"), blob("a.ts"), blob("src/a.ts")], false).files).toEqual([
      "a.ts",
      "src/a.ts",
      "src/b.ts",
    ]);
  });

  it("passes through GitHub's truncated flag", () => {
    expect(filterTree([blob("a.ts")], true).truncated).toBe(true);
  });

  it("fills the cap with source before docs, even when the source is deeper", () => {
    const docs = Array.from({ length: MAX_FILES }, (_, i) => blob(`docs/page${i}.md`));
    const result = filterTree([...docs, blob("packages/core/src/server/index.ts")], false);
    expect(result.files).toContain("packages/core/src/server/index.ts");
    expect(result.totalFiles).toBe(MAX_FILES + 1);
  });

  it("does not let one wide folder take the whole cap", () => {
    const wide = Array.from({ length: MAX_FILES }, (_, i) => blob(`scripts/s${i}.js`));
    const result = filterTree([...wide, blob("packages/core/src/index.ts")], false);
    expect(result.files).toContain("packages/core/src/index.ts");
  });
});

describe("rank", () => {
  const rows: [string, number][] = [
    ["README.md", 0],
    [".gitignore", 0],
    ["src/index.ts", 0],
    ["packages/core/src/main.py", 0],
    ["src/styles.css", 1],
    ["src/notes.md", 1],
    ["docs/intro.md", 2],
    ["docs/snippet.ts", 2],
    ["examples/basic/app.tsx", 2],
    ["packages/core/__tests__/a.ts", 2],
    ["evals/case-1/input.ts", 2],
    [".github/workflows/ci.yml", 2],
    ["src/index.test.ts", 2],
    ["src/button.spec.tsx", 2],
    ["pkg/server_test.go", 2],
  ];

  it.each(rows)("%j → %i", (path, expected) => {
    expect(rank(path)).toBe(expected);
  });
});

describe("githubErrorMessage", () => {
  // Built from local components so the expected HH:MM holds in any timezone.
  const reset = String(new Date(2026, 0, 1, 14, 5).getTime() / 1000);
  const RATE = "GitHub rate limit reached. Try again after 14:05.";
  const NOT_FOUND = "Repository not found or private.";
  const UNREACHABLE = "Couldn't reach GitHub.";

  const rows: [string, number, Record<string, string>, string][] = [
    ["404", 404, {}, NOT_FOUND],
    ["403 with remaining=0", 403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": reset }, RATE],
    ["429 with reset", 429, { "x-ratelimit-reset": reset }, RATE],
    ["403 with quota left", 403, { "x-ratelimit-remaining": "42", "x-ratelimit-reset": reset }, UNREACHABLE],
    ["429 without reset", 429, {}, UNREACHABLE],
    ["500", 500, {}, UNREACHABLE],
    ["409 (empty repo)", 409, {}, EMPTY_REPO],
  ];

  it.each(rows)("%s", (_, status, headers, expected) => {
    expect(githubErrorMessage(status, new Headers(headers))).toBe(expected);
  });
});

describe("getRepoTree empty-tree detection", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Stubbed fetch: first call is the repo, second the tree. No real network.
  function stubGitHub(tree: Response) {
    const repo = Response.json({ default_branch: "main" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(repo).mockResolvedValueOnce(tree));
  }
  const run = () =>
    getRepoTree.execute!({ owner: "a", repo: "b" }, { toolCallId: "t", messages: [], context: {} });

  const rows: [string, () => Response][] = [
    ["only binaries and lockfiles", () => Response.json({ tree: [blob("logo.png"), blob("yarn.lock")], truncated: false })],
    ["only directories", () => Response.json({ tree: [{ path: "src", type: "tree" }], truncated: false })],
    ["no entries", () => Response.json({ tree: [], truncated: false })],
    ["GitHub 409 (repo with no commits)", () => new Response("Git Repository is empty.", { status: 409 })],
  ];

  it.each(rows)("throws EMPTY_REPO for %s", async (_, tree) => {
    stubGitHub(tree());
    await expect(run()).rejects.toThrow(EMPTY_REPO);
  });

  it("returns the tree when at least one file survives filtering", async () => {
    stubGitHub(Response.json({ tree: [blob("logo.png"), blob("src/index.ts")], truncated: false }));
    await expect(run()).resolves.toMatchObject({ files: ["src/index.ts"], totalFiles: 1 });
  });
});
