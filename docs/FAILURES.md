# Failure and edge cases: primary flow

Flow: home (`/`) → `/tour/[owner]/[repo]` → file tree, tour steps, code panel.

Status is as of FE-08. **Handled**: the user sees a specific, plain message and a way forward. **Partly**: works, with a known limit (noted).

| Case | How to trigger it | What the user sees | Status |
| --- | --- | --- | --- |
| Network offline before send | DevTools → Network → **Offline**, then load a tour URL | Error card: "You're offline. Reconnect and try again." and a **Retry generating the tour** button. No request is sent while offline. | Handled |
| Connection killed mid-stream | `?sabotage=midstream`, or DevTools → Offline while the tree is loading | The file tree stays. Below it: "The connection dropped before the tour finished. Check your network and retry." with a note that retrying starts over. | Partly: retry re-runs the whole request (the SDK can only resume with a server-side stream store, which we don't have) and says so |
| AI provider 429 / quota | `?sabotage=429`, or exhaust the Groq free tier | "The AI is busy (free-tier limit). Wait a minute and retry." | Handled |
| AI provider timeout | Provider holds the connection past 25s (the route's `timeout.totalMs`) | "This is taking too long. Retry?" (the route turns its own timeout abort into an error) | Handled |
| Missing API key | Remove `GROQ_API_KEY` from `.env.local` and restart | "The AI provider isn't configured. Set GROQ_API_KEY in .env.local and restart the server." | Handled |
| GitHub 404 | `/tour/vercel/does-not-exist-xyz` | "Repository not found or private." | Handled |
| GitHub rate limit | Unset `GITHUB_TOKEN`, run more than 60 tours in an hour | "GitHub rate limit reached. Try again after HH:MM." | Handled |
| Malformed tool output | `?sabotage=malformed` (model's paths rejected); a zod tool-input failure maps the same way | Tree stays; "The AI model didn't pick any files from the tree." Schema failures show "The AI returned the tour in the wrong format." | Handled |
| Too many requests from one IP | More than 10 tours (or 60 file loads) in 10 minutes | "Too many requests from your network. Try again in N minutes." (HTTP 429 with `Retry-After`) | Partly: limits are in memory, per server instance |
| Empty input on home | Submit the empty form | Inline "Paste a GitHub repository URL." with focus back on the field | Handled |
| Empty first-run home | Open `/` | Pitch, the input, and three clickable example repos that fill and submit the form | Handled |
| Repo with zero files after filtering | A repo with only images/lockfiles, or an empty repo (GitHub 409) | "This repo has no files we can tour: after skipping binaries, lockfiles and node_modules, nothing is left. Try another repo." | Handled |
| Empty tour plan | Model finishes without calling `planTour` | "The AI finished without picking any files to tour." with retry | Handled |
| File fetch failure in the code panel | DevTools → Network → block `/api/file*`, then click a file | "Couldn't open this file" with the reason and **Retry loading this file**. Rapid clicks are harmless (requests abort). | Handled |
| Code panel, no file selected | Tour loaded but no step picked yet (or the plan failed) | "Pick a step or a file to see its code." | Handled |
| Slow response | `?sabotage=slow` (8s delay) | Skeleton with the same size as the real content; after 8s the status adds "Still working: big repos can take up to 25 seconds." | Handled |
| Unexpected route crash | Temporarily add `throw new Error("boom")` to `TourPlanner`'s render (no sabotage mode for this) | Designed error page: what happened in plain words, **Try again** (`retry()`), **Back to home**. No stack trace. Root layout crashes use `global-error.tsx`. | Handled |

## Sabotage switch

For testing and recording failure states without breaking anything for real.

- Enable with `ENABLE_SABOTAGE=1` in `.env.local` (Development) or Vercel **Preview** env. Without it, the `sabotage` value is ignored and the request runs normally. It can't turn on in Production: `sabotageMode()` ignores it when `VERCEL_ENV=production` and in any production build that isn't a Vercel Preview (including local `npm start`).
- Use it by adding `?sabotage=<mode>` to a tour URL, e.g. `/tour/sindresorhus/is?sabotage=midstream`. `TourPlanner` forwards it in the request body to `POST /api/tour`. Only the first attempt is sabotaged; **Retry** sends `sabotage: null`, so the recovery path can be demonstrated. The gate is `sabotageMode()` in `src/lib/sabotage.ts`.

| Mode | What the route does | What you should see |
| --- | --- | --- |
| `midstream` | Runs the real request, sends the file tree, waits 1s, then kills the stream | Tree stays, mid-stream error card below it |
| `429` | Returns HTTP 429 before calling the model | "The AI is busy (free-tier limit)…" |
| `malformed` | `planTour` validates the model's paths against an empty tree, so it rejects all of them (the real invalid-output path) | Tree stays, tool error card |
| `slow` | Waits 8s before calling the model | Skeleton, then the "Still working" note, then the normal tour |

## Where the messages come from

- `src/lib/errors.ts` → `userMessage()` maps provider, transport and tool errors to the messages above. It runs on the server (stream `onError`) and the client (`useChat` error, tool `errorText`). Covered by `errors.test.ts`.
- GitHub errors: `githubErrorMessage()` in `src/lib/github.ts`; empty trees: `getRepoTree`.
- Route crashes: `src/app/error.tsx`, `src/app/tour/[owner]/[repo]/error.tsx`, `src/app/global-error.tsx`, all rendering `src/components/RouteError.tsx`.
