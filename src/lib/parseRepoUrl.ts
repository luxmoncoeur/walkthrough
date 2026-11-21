export type ParseRepoUrlResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; error: string };

export const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
export const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const INVALID = "That doesn't look like a valid owner/repo.";

export function parseRepoUrl(input: string): ParseRepoUrlResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Paste a GitHub repository URL." };

  const withoutQuery = trimmed.split(/[?#]/)[0];
  const hasProtocol = /^https?:\/\//i.test(withoutQuery);
  const segments = withoutQuery
    .replace(/^https?:\/\//i, "")
    .split("/")
    .filter(Boolean);

  // Owners can't contain dots, so a dotted first segment is a host, not "owner/repo" shorthand.
  if (hasProtocol || segments[0]?.includes(".")) {
    const host = segments.shift()?.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      return { ok: false, error: "Only GitHub repositories are supported." };
    }
  }

  const [owner, rawRepo] = segments;
  if (!owner || !OWNER_RE.test(owner)) return { ok: false, error: INVALID };
  if (!rawRepo) {
    return { ok: false, error: "That URL is missing the repository name." };
  }

  const repo = rawRepo.replace(/\.git$/, "");
  if (!REPO_RE.test(repo) || repo === "." || repo === "..") {
    return { ok: false, error: INVALID };
  }
  return { ok: true, owner, repo };
}
