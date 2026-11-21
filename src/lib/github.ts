export const EMPTY_REPO =
  "This repo has no files we can tour: after skipping binaries, lockfiles and node_modules, nothing is left. Try another repo.";

/** Maps a failed GitHub response to a message safe to show users. */
export function githubErrorMessage(status: number, headers: Headers): string {
  if (status === 404) return "Repository not found or private.";
  // GitHub answers 409 "Git Repository is empty" for the tree of a repo with no commits.
  if (status === 409) return EMPTY_REPO;
  const reset = headers.get("x-ratelimit-reset");
  const limited =
    status === 429 || (status === 403 && headers.get("x-ratelimit-remaining") === "0");
  if (limited && reset) {
    const time = new Date(Number(reset) * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `GitHub rate limit reached. Try again after ${time}.`;
  }
  return "Couldn't reach GitHub.";
}

/** Encodes each segment of a slash-separated path (file path or branch name) for a URL. */
export function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Server-only GitHub REST call. Throws an Error with a user-facing message on any failure. */
export async function githubFetch(
  path: string,
  { accept = "application/vnd.github+json", notFound }: { accept?: string; notFound?: string } = {},
): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  let res: Response;
  try {
    res = await fetch(`https://api.github.com${path}`, {
      cache: "no-store",
      headers: { Accept: accept, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new Error("Couldn't reach GitHub.");
  }
  if (res.status === 404 && notFound) throw new Error(notFound);
  if (!res.ok) throw new Error(githubErrorMessage(res.status, res.headers));
  return res;
}
