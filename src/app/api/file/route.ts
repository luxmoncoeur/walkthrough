import type { NextRequest } from "next/server";
import { encodePath, githubFetch } from "@/lib/github";
import { highlight } from "@/lib/highlight";
import { createRateLimiter, rateLimit } from "@/lib/rateLimit";
import { fileQuerySchema } from "@/lib/schemas";

// shortcut: big files are cut at this many characters, not paged; add range loading if tours need them.
const MAX_CHARS = 200_000;
const NOT_FOUND = "File not found.";
// Each request costs a GitHub call; owner/repo/ref/path length caps (400) come from fileQuerySchema.
const limiter = createRateLimiter(60, 10 * 60_000);

/**
 * GET /api/file?owner=&repo=&ref=&path= → JSON { html, truncated, empty } with the file syntax-highlighted.
 * JSON (not text/html) so a browser never renders untrusted repo content as a page. Errors are plain text.
 */
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, limiter);
  if (limited) return limited;
  const parsed = fileQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return new Response("That file request isn't valid.", { status: 400 });

  const { owner, repo, ref, path } = parsed.data;
  try {
    const res = await githubFetch(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
      { accept: "application/vnd.github.raw", notFound: NOT_FOUND },
    );
    const text = await res.text();
    const truncated = text.length > MAX_CHARS;
    const html = await highlight(truncated ? text.slice(0, MAX_CHARS) : text, path);
    return Response.json(
      { html, truncated, empty: text.length === 0 },
      // Same file at the same ref rarely changes; lets the browser skip refetching on step switches.
      { headers: { "cache-control": "private, max-age=300" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't reach GitHub.";
    return new Response(message, { status: message === NOT_FOUND ? 404 : 502 });
  }
}
