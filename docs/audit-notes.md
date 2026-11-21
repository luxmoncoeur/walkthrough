# Audit notes (raw, for AUDIT.md)

Date: 2026-11-21. Lighthouse 13.6.0, mobile preset, headless Chrome, `next build && next start`.
Command as in the brief, but on port 3100 (port 3000 was taken by a running dev server; the port doesn't affect scores).
"Before" = `feat/capstone-final` with `feat/error-states` merged, built from the git index before any of these changes.

## Scores

| Page | | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| `/` | before | 100 | 100 | 100 | 100 |
| `/` | after | 100 | 100 | 100 | 100 |
| `/tour/sindresorhus/is` | before | 92 | 96 | 100 | 100 |
| `/tour/sindresorhus/is` | after | 93 | 100 | 100 | 100 |

Metrics:

| Page | | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | before / after | 0.9 s / 0.9 s | 0.9 s / 0.9 s | 10 / 10 ms | 0 / 0 | 0.9 / 0.9 s |
| tour | before / after | 0.9 s / 0.9 s | 3.0 s / 3.0 s | 20 / 40 ms | 0.077 / 0.027 | 3.2 / 3.8 s |

The tour page calls the real model, so LCP/SI vary run to run with Groq latency.

## What Lighthouse found (before) and what changed

- **Contrast (tour, a11y 96)**: Shiki `github-light` token colors `#22863a` (4.43:1), `#d73a49` (4.38:1), `#e36209` (3.34:1) on `#fafaf9`. Switched to `github-light-high-contrast` (`src/lib/highlight.ts`); checked every theme foreground: all pass except pale text used on the theme's own backgrounds for rare "invalid" tokens.
- **Contrast not caught by Lighthouse**: draft (still-streaming) tour steps used `opacity-70`, putting the muted path text at ~3.6:1. Now a dashed border marks drafts (`TourSteps.tsx`). Lighthouse misses it because the audit ends after streaming.
- **CLS 0.077 (tour)**: the footer started in view and got pushed down as the tour streamed in. Tour page wrapper gets `min-h-dvh`, so the footer starts below the fold. CLS now 0.027.
- **SEO**: tried per-repo `generateMetadata`; with `cacheComponents` the params are request-time, so Next streamed the `<title>`/description into `<body>` and SEO dropped to 90 (`meta-description`). Reverted to static `metadata` for the tour route ("Codebase tour" + description). About and Health got their own descriptions; home uses the layout's.
- **LCP 3.0 s (tour)**: LCP element is the first AI-written step reason (render delay ~3.5 s = model latency). Not fixable in render code; left as is.
- **Unused JS ~94 KiB (tour)**: the chunk with the AI SDK client (`useChat`, `DefaultChatTransport`) and zod. Needed for streaming; left as is. Shiki is **not** in any client chunk (grepped `.next/static/chunks`); it only runs in `/api/file`.
- **Render-blocking CSS (~300 ms est.)**, **legacy JS 14 KiB**: Next/Tailwind defaults; left as is.

## Accessibility changes outside Lighthouse

- Keyboard-reachable **Stop generating** button while the tour request is in flight (`TourPlanner.tsx`, `useChat().stop`). Stopping shows "You stopped generating the tour." in the error card and moves focus to its Retry button, so focus doesn't fall to `<body>`.
- Streamed output is announced via the existing `aria-live="polite"` status line (phase changes, "Tour ready: N steps"), not token by token.
- Every component test runs axe-core (`src/test/axe.ts`) and asserts zero violations. `color-contrast` is disabled there (jsdom can't compute colors); Lighthouse covers it.

## Abuse protection

- Per-IP fixed-window limits (`src/lib/rateLimit.ts`, IP = first `x-forwarded-for` entry): `/api/tour` 10 per 10 min, `/api/file` 60 per 10 min. 429 + `Retry-After` (seconds) + "Too many requests from your network. Try again in N minutes." `userMessage()` shows that text as-is instead of the provider "AI is busy" text. In-memory, per instance (`shortcut:` comment).
- `/api/tour` rejects bodies over 10 KB with 413 (checks `content-length` and the bytes actually read). The client now sends only `{ owner, repo, sabotage }` (`prepareSendMessagesRequest`), not the message history.
- Over-long owner (>39), repo (>100), ref (>255), path (>1000) → 400 via the existing Zod schemas.
- `maxDuration = 30` kept on `/api/tour`.
- Sabotage switch: `sabotageMode()` now also returns null when `VERCEL_ENV=production`, and in any production build that isn't a Vercel Preview (e.g. local `npm start`). Table-tested.
- Smoke-tested against `next start`: 11 KB body → 413; 60-char owner → 400; 1100-char path → 400; 11th tour request from one IP → 429, `retry-after: 600`; another IP still allowed; 61st file request → 429.

## Tests

- Component tests (jsdom via per-file `// @vitest-environment jsdom`; lib tests stay on node): RepoForm, FileTree, TourSteps, CodePanel, TourPlanner (useChat mocked, fetch stubbed). 5 of 8 components; components folder 94.6% lines.
- Untested components: Header, Footer, RouteError (static or near-static).

## Redesign ("codebase as an exhibition")

Same setup: Lighthouse 13.6.0, mobile preset, headless Chrome, `next build && next start` on port 3100, built from the working tree after the visual redesign.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/tour/sindresorhus/is` | 93 | 100 | 100 | 100 |

| Page | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- |
| `/` | 0.8 s | 0.8 s | 10 ms | 0 | 0.8 s |
| tour | 0.8 s | 3.2 s | 50 ms | 0.029 | 1.1 s |

- Fonts: Instrument Serif 400, IBM Plex Sans 400/500 and IBM Plex Mono 400/500 via `next/font` (self-hosted, preloaded). Four woff2 files, ~75 KiB total. They replace Geist and Geist Mono.
- Tour LCP is still bound to model latency: the serif `<h1>` paints at ~0.4 s in the trace, and the simulated 3.2 s follows the AI-written stops.
- Contrast: every palette token was checked against paper `#f5f2ea` (ink 15.85, muted 6.39, faint 5.23, accent 7.11, danger 6.93, `rule-strong` 3.40 for meaningful borders). Shiki `github-light-high-contrast` token colors all pass on the new paper, except the pale "invalid" colors drawn on their own backgrounds (unchanged).

## shadcn/ui pass

Same setup, after moving the UI onto shadcn/ui (Base UI primitives: Button, Input, Badge, Card, Skeleton), with the same paper/ink/green palette on shadcn token names.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/tour/sindresorhus/is` (3 runs) | 90 / 89 / 90 | 100 | 100 | 100 |

| Page | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- |
| `/` | 0.8 s | 0.8 s | 10 ms | 0 | 0.8 s |
| tour (run 1) | 0.8 s | 3.6 s | 50 ms | 0.027 | 1.7 s |

- Tour performance is at the 90 line. The LCP element is the first AI-written stop caption again (render delay ~3.3 s, waiting on Groq), as in the first audit. Unused JS is unchanged at ~94 KiB, so the Base UI components didn't add measurable client weight.
- shadcn's `dark:` classes followed the OS setting (`prefers-color-scheme`), which turned the input gray for dark-mode users. `globals.css` now binds `dark:` to a `.dark` class that is never set.

## Dark theme pass

Same setup, after switching to one dark theme (`.dark` on `<html>`), Plus Jakarta Sans for headings and UI, JetBrains Mono for code only, the Shiki `github-dark-high-contrast` theme, and a ReactBits `BlurText` headline on home.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/tour/sindresorhus/is` | 100 | 100 | 100 | 100 |

| Page | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- |
| `/` | 0.8 s | 0.8 s | 10 ms | 0 | 0.8 s |
| tour | 0.8 s | 0.8 s | 10 ms | 0.027 | 1.5 s |

- The tour's LCP element is now the `<h1>` (white heading on dark) instead of the AI-written caption, so Groq latency no longer drives LCP. Expect this to flip back if a caption ever outgrows the heading.
- Unused JS: 54 KiB on home and 140 KiB on tour (was ~94 KiB), mostly `motion` from BlurText plus the AI SDK chunk.
- Contrast (dark): every token was checked on background, card and muted surfaces; the lowest text pair is faint on muted at 4.97:1, and input borders are ≥3.52:1. Shiki `github-dark-high-contrast` token colors all pass on the card except one "invalid token" background swatch.
- BlurText (ReactBits) was edited to render a `<span>` (valid inside `<h1>`) and to pass the React Compiler lint rules. It keeps the full text in an sr-only span and wraps motion in `MotionConfig reducedMotion="user"`.
- Home redesigned in the reactbits.dev layout (compact two-line headline, form as the CTA, showcase panel with example code and tour windows). Lighthouse unchanged: `/` 100/100/100/100, tour 100/100/100/100.
