import { tool } from "ai";
import { encodePath, githubFetch } from "../github";
import { repoInputSchema } from "../schemas";

export const MAX_FILES = 300;

export type RepoTree = {
  owner: string;
  repo: string;
  defaultBranch: string;
  totalFiles: number;
  files: string[];
  truncated: boolean;
};

type TreeEntry = { path: string; type: string };

const IGNORED_DIRS = new Set(["node_modules", ".git"]);
const LOCKFILES = new Set([
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "Cargo.lock",
  "Gemfile.lock",
  "poetry.lock",
  "composer.lock",
  "Pipfile.lock",
  "go.sum",
]);
const BINARY_EXT =
  /\.(png|jpe?g|gif|webp|avif|bmp|ico|svg|tiff?|heic|psd|woff2?|ttf|otf|eot|zip|gz|tgz|tar|rar|7z|jar|war|exe|dll|so|dylib|bin|o|a|class|pyc|wasm|pdf|mp3|mp4|wav|ogg|mov|avi|webm)$/i;

const LOW_PRIORITY_DIRS = new Set([
  "docs",
  "doc",
  "examples",
  "example",
  "test",
  "tests",
  "__tests__",
  "__mocks__",
  "fixtures",
  "__fixtures__",
  "e2e",
  "evals",
  "samples",
  "bench",
  "benchmarks",
  "vendor",
  "third_party",
]);
const SOURCE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|c|cc|cpp|h|hpp|swift|vue|svelte|ex|exs|scala|dart|lua)$/i;
const TEST_FILE = /\.(test|spec)\.[^./]+$|_test\.go$/;

/** 0: root files and source code; 1: other files; 2: docs, examples, tests, dot-folders. */
export function rank(path: string): number {
  const segments = path.split("/");
  if (segments.length === 1) return 0;
  const dirs = segments.slice(0, -1);
  if (dirs.some((d) => d.startsWith(".") || LOW_PRIORITY_DIRS.has(d)) || TEST_FILE.test(path)) {
    return 2;
  }
  return SOURCE_EXT.test(path) ? 0 : 1;
}

function isRelevant({ path, type }: TreeEntry): boolean {
  if (type !== "blob") return false;
  const segments = path.split("/");
  if (segments.some((s) => IGNORED_DIRS.has(s))) return false;
  const name = segments[segments.length - 1];
  return !LOCKFILES.has(name) && !BINARY_EXT.test(name);
}

/** Drops noise, then fills the cap by rank (source before docs/tests), then shallowest first. */
export function filterTree(
  entries: TreeEntry[],
  githubTruncated: boolean,
): Pick<RepoTree, "totalFiles" | "files" | "truncated"> {
  const paths = entries.filter(isRelevant).map((e) => e.path);
  const depth = (p: string) => p.split("/").length;
  // nth file within its folder: taking every folder's 1st file, then 2nd, ... stops one wide folder eating the cap.
  const seen = new Map<string, number>();
  const nth = new Map<string, number>();
  for (const p of [...paths].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))) {
    const dir = p.slice(0, p.lastIndexOf("/") + 1);
    const n = seen.get(dir) ?? 0;
    seen.set(dir, n + 1);
    nth.set(p, n);
  }
  const files = [...paths]
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        nth.get(a)! - nth.get(b)! ||
        depth(a) - depth(b) ||
        a.localeCompare(b),
    )
    .slice(0, MAX_FILES)
    .sort((a, b) => a.localeCompare(b));
  return {
    totalFiles: paths.length,
    files,
    truncated: githubTruncated || paths.length > MAX_FILES,
  };
}

export const getRepoTree = tool({
  description:
    "Fetch the file tree of a public GitHub repository's default branch. Returns file paths only (no contents), with noise like node_modules, lockfiles and binaries removed.",
  inputSchema: repoInputSchema,
  execute: async ({ owner, repo }): Promise<RepoTree> => {
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const { default_branch }: { default_branch: string } = await (await githubFetch(base)).json();
    const tree: { tree: TreeEntry[]; truncated: boolean } = await (
      await githubFetch(`${base}/git/trees/${encodePath(default_branch)}?recursive=1`)
    ).json();
    return { owner, repo, defaultBranch: default_branch, ...filterTree(tree.tree, tree.truncated) };
  },
});
