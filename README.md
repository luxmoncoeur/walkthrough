# Walkthrough

AI-generated guided tours of any codebase.

Point Walkthrough at a GitHub repo and it builds an interactive, step-by-step tour: it highlights files in a sensible order, explains each part in plain language, and traces how a request flows through the app.

**Status:** in progress. Capstone for the FlyRank AI Internship (Frontend AI Engineering track).

## Why

- Groupmates inherit code they didn't write and don't know where to start.
- Project defenses ask "explain this part," and reading a repo cold is slow.
- READMEs say *what* a project is, rarely *how the code fits together*.

## Planned features

- [x] Paste a public GitHub repo URL → fetch the file tree
- [x] AI picks the important files and orders them into a tour
- [ ] Step-by-step tour UI with syntax-highlighted code and focused line ranges (steps and a highlighted code panel work; no focused line ranges yet)
- [ ] Streaming plain-language explanations per step
- [ ] "Follow a request" mode: trace one feature end to end
- [ ] Shareable tour links

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Vercel AI SDK with Groq (`openai/gpt-oss-120b`, free tier). The provider, model and key name are constants at the top of `src/app/api/tour/route.ts`, so swapping providers is a small, local change.
- GitHub REST API for repo contents
- Deployed on Vercel

## Getting started

You'll need Node.js LTS and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

`.env.local` is gitignored. Only `.env.example` is committed.

### Environment variables

| Name | Required? | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | GitHub personal access token. Raises the GitHub API rate limit from 60 to 5,000 requests per hour. |
| `GROQ_API_KEY` | Yes, for tour generation | Groq API key. Free key from [console.groq.com](https://console.groq.com). |

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Home: one-line pitch and a GitHub repo URL input (placeholder form, no submit logic yet). |
| `/tour/[owner]/[repo]` | Tour view. The model fetches the repo's file tree (shown as a collapsible tree) and picks 5–8 files to read first. Clicking a step, or any file in the tree, opens it in the code panel; step 1 opens automatically. |
| `/about` | How it works, in three steps. |
| `/health` | Health check: live GitHub API rate limit (remaining / limit, reset time) and whether a token is configured. |
| any unknown route | Custom 404 page. |

## Tool contract

The tour route (`POST /api/tour`, body `{ owner, repo }`) runs two forced steps: the model calls `getRepoTree`, then `planTour`. Both tools run on the server. If `getRepoTree` fails, the model skips `planTour` and replies with one sentence (the UI shows the tool's error instead).

### `getRepoTree`

Defined in `src/lib/tools/getRepoTree.ts`.

**Name:** `getRepoTree`

**Input** (Zod, same rules as the home page form):

| Field | Type | Rule |
| --- | --- | --- |
| `owner` | string | 1–39 letters, digits or hyphens; no leading or trailing hyphen |
| `repo` | string | 1–100 letters, digits, `.`, `_` or `-`; not `.` or `..` |

**Output:**

```ts
{
  owner: string;
  repo: string;
  defaultBranch: string;
  totalFiles: number;   // files left after filtering, before the cap
  files: string[];      // at most 300 paths, sorted by path (see "Which files are kept")
  truncated: boolean;   // true if capped at 300 or GitHub truncated the tree
}
```

Filtered out: `node_modules/`, `.git/`, lockfiles, images, fonts and other binaries.

**Which files are kept** when a repo has more than 300: root files and source code first, then other files, then docs, examples, tests, evals and dot-folders. Within each group the tool takes every folder's first file, then every folder's second file, and so on (shallowest first), so one large folder can't use up the whole budget.

**Errors** (thrown, so the UI shows the tool's `output-error` state):

| Cause | Message |
| --- | --- |
| 404 | `Repository not found or private.` |
| 403 with `x-ratelimit-remaining: 0`, or 429, with `x-ratelimit-reset` | `GitHub rate limit reached. Try again after HH:MM.` (server local time) |
| Anything else, including network failures | `Couldn't reach GitHub.` |

**Example output** (illustrative):

```json
{
  "owner": "vercel",
  "repo": "ms",
  "defaultBranch": "main",
  "totalFiles": 8,
  "files": [
    ".eslintrc.js",
    ".github/workflows/ci.yml",
    "README.md",
    "license.md",
    "package.json",
    "src/index.test.ts",
    "src/index.ts",
    "tsconfig.json"
  ],
  "truncated": false
}
```

### `planTour`

Defined in `src/lib/tools/planTour.ts`. The model records its picks here instead of writing free text, so the UI gets structured, validated steps.

**Input:** `{ steps: { path: string; reason: string }[] }`, 1–8 steps (the prompt asks for 5–8), in reading order.

**Output:** `{ steps: { path: string; reason: string }[] }`: the input with any path that isn't in the fetched tree removed (exact match), duplicates dropped, at most 8.

**Error:** `The AI model didn't pick any files from the tree.` when no path survives.

### File contents: `GET /api/file`

Not a model tool: the code panel calls it directly. Query: `owner`, `repo`, `ref` (branch), `path`. Paths must be relative with no empty, `.` or `..` segments.

Returns JSON `{ html, truncated, empty }`: the file highlighted on the server with [Shiki](https://shiki.style) (`github-light` theme, language picked from the file extension, plain text if unknown). Files are cut at 200,000 characters (`truncated: true`). Shiki escapes the code, and the response is JSON rather than `text/html`, so untrusted repo content is never rendered as a page.

| Status | Body |
| --- | --- |
| 400 | `That file request isn't valid.` |
| 404 | `File not found.` |
| 502 | The GitHub error message (rate limit or `Couldn't reach GitHub.`) |

## License

[MIT](LICENSE)
