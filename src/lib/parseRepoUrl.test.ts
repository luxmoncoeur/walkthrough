import { describe, expect, it } from "vitest";
import { parseRepoUrl } from "./parseRepoUrl";

const accepted = [
  "https://github.com/vercel/next.js",
  "http://github.com/vercel/next.js",
  "https://www.github.com/vercel/next.js",
  "github.com/vercel/next.js",
  "vercel/next.js",
  "https://github.com/vercel/next.js/",
  "https://github.com/vercel/next.js.git",
  "https://github.com/vercel/next.js?tab=readme",
  "https://github.com/vercel/next.js#readme",
  "https://github.com/vercel/next.js/tree/main/packages",
  "  https://github.com/vercel/next.js  ",
];

const EMPTY = "Paste a GitHub repository URL.";
const HOST = "Only GitHub repositories are supported.";
const NO_REPO = "That URL is missing the repository name.";
const INVALID = "That doesn't look like a valid owner/repo.";

const rejected: [string, string][] = [
  ["", EMPTY],
  ["   ", EMPTY],
  ["https://gitlab.com/vercel/next.js", HOST],
  ["gitlab.com/vercel/next.js", HOST],
  ["github.com/vercel", NO_REPO],
  ["https://github.com/vercel/", NO_REPO],
  ["github.com/-vercel/next.js", INVALID],
  ["github.com/vercel-/next.js", INVALID],
  ["github.com/ver_cel/next.js", INVALID],
  [`github.com/${"a".repeat(40)}/next.js`, INVALID],
  [`github.com/vercel/${"a".repeat(101)}`, INVALID],
  ["github.com/vercel/next!js", INVALID],
  ["vercel/.", INVALID],
  ["vercel/..", INVALID],
];

describe("parseRepoUrl", () => {
  it.each(accepted)("accepts %j", (input) => {
    expect(parseRepoUrl(input)).toEqual({ ok: true, owner: "vercel", repo: "next.js" });
  });

  it.each(rejected)("rejects %j", (input, error) => {
    expect(parseRepoUrl(input)).toEqual({ ok: false, error });
  });

  it("accepts boundary lengths", () => {
    const owner = "a".repeat(39);
    const repo = "b".repeat(100);
    expect(parseRepoUrl(`${owner}/${repo}`)).toEqual({ ok: true, owner, repo });
  });
});
