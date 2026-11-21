# Deployment

Walkthrough runs on Vercel. Production: <https://walkthrough-proj.vercel.app>

## Vercel setup

1. Import the GitHub repo in Vercel. Framework preset: **Next.js**. Keep the default build command (`next build`), output settings and install command (`npm install`).
2. Add environment variables (**Settings → Environment Variables**):

   | Variable          | Production | Preview  | Development | Notes                                                                                                                                              |
   | ----------------- | ---------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `GROQ_API_KEY`    | ✅         | ✅       | optional    | Required for tour generation. Without it the tour shows "The AI provider isn't configured."                                                        |
   | `GITHUB_TOKEN`    | ✅         | ✅       | optional    | Raises the GitHub API limit from 60 to 5,000 requests per hour, shared by all users of that deployment.                                            |
   | `ENABLE_SABOTAGE` | ❌         | ✅ (`1`) | optional    | Turns on `?sabotage=` failure modes ([FAILURES.md](FAILURES.md)). The code ignores it when `VERCEL_ENV=production`, but don't set it there anyway. |

   For local development, put the same values in `.env.local` (gitignored).

3. Env var changes only apply to new deployments. After changing one, redeploy (**Deployments → ⋯ → Redeploy**).

`/api/tour` sets `maxDuration = 30` seconds and stops the model itself after 25 seconds, so it fits Vercel's default function limit.

## Preview per PR

- Every push to a branch with an open PR gets its own Preview deployment. Vercel posts its URL on the PR.
- Previews use the Preview env vars, so sabotage modes work there: e.g. `<preview-url>/tour/sindresorhus/is?sabotage=midstream`.
- Merging to `main` deploys to Production.
- The owner pushes and merges manually; nothing deploys from an AI assistant.

## Rate limits

| Route            | Limit per IP               | Over the limit                                                                                      |
| ---------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `POST /api/tour` | 10 requests per 10 minutes | 429 with `Retry-After` (seconds) and "Too many requests from your network. Try again in N minutes." |
| `GET /api/file`  | 60 requests per 10 minutes | Same                                                                                                |

The IP is the first `x-forwarded-for` entry, which Vercel sets. `/api/tour` also rejects bodies over 10 KB with 413.

**Limit:** the counters live in memory (`src/lib/rateLimit.ts`). Each serverless instance counts on its own, and the counts reset when an instance cold-starts or a new deployment goes live. Under real traffic someone can get more than 10 tours in 10 minutes. Move the counters to a shared store (Vercel KV / Upstash Redis) if traffic grows.

Upstream limits still apply: Groq's free tier ("The AI is busy (free-tier limit)") and GitHub's API (60 per hour without a token, 5,000 with one).

## Smoke-test checklist

Run this on every Production deploy, and on a Preview before merging.

- [ ] `/` loads, the headline animates in, and an example repo button opens its tour.
- [ ] `/tour/sindresorhus/is`: the file tree loads, 5–8 steps appear, step 1 opens in the code panel with highlighted code. Clicking another step or a tree file changes the code panel.
- [ ] `/health`: status `ok`, "Token configured: yes", and the remaining count is out of 5,000 (not 60).
- [ ] `/this-does-not-exist`: custom 404 page with **Back to home**.
- [ ] `/tour/vercel/does-not-exist-xyz`: "Repository not found or private."
- [ ] Preview only: `/tour/sindresorhus/is?sabotage=midstream` shows the tree, then the dropped-connection error; **Retry** produces a normal tour.
- [ ] Preview only: `?sabotage=429` shows "The AI is busy (free-tier limit)…".
- [ ] Production: `/tour/sindresorhus/is?sabotage=429` runs a normal tour (sabotage is ignored).

## Rollback

1. **Fastest:** Vercel dashboard → **Deployments** → pick the last good Production deployment → **⋯ → Instant Rollback**. No rebuild; takes effect in seconds.
2. **Then fix the history:** `git revert <bad-commit>` on a branch, open a PR, check its Preview, and merge. The next Production deploy replaces the rollback.
3. Re-run the smoke-test checklist.

Note: after an Instant Rollback, Vercel doesn't auto-assign new pushes to Production until you undo it (**Undo Rollback**, or promote a newer deployment).

## Sign-off

| Name | Gio Angelo Lat |
| Date | 2026-11-21 |
| Deployment URL / commit | https://walkthrough-proj.vercel.app (main, after merging PR #6) |
