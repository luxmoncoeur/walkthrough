# CLAUDE.md

Guidance for AI assistants working in this repo.

## Project

Walkthrough generates interactive guided tours of a GitHub codebase. See README.md for features.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS for all styling; no CSS-in-JS
- Vercel AI SDK with Claude for generation; validate structured model output with Zod
- GitHub REST API for repo contents
- Node.js LTS, npm

## Structure

- `src/app/`: routes and pages
- `src/app/api/`: server routes (all AI and GitHub calls happen here, never in the browser)
- `src/components/`: React components, one per file, PascalCase filenames
- `src/lib/`: shared helpers (GitHub client, prompts, schemas)

## Conventions

- Commits follow Conventional Commits 1.0.0: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Small, focused commits.
- Prefer server components; add `"use client"` only when a component needs state or browser APIs.
- Every AI feature handles loading, streaming, error, and retry states.
- Keep components accessible: semantic HTML, keyboard navigation, visible focus.
- Don't add dependencies for things a few lines can do.
- Inputs that accept `owner/repo` shorthand use `type="text"` with `inputMode="url"`, never `type="url"` or a `pattern` attribute; forms with custom validation set `noValidate`.
- Input validation lives in a pure function in `src/lib/` with a table-driven Vitest test that has one row per accepted and rejected example and asserts the exact error string.
- Form errors render as inline text in an always-mounted `aria-live="polite"` element, linked to the field with `aria-describedby`, with `aria-invalid` on the field and focus returned to it; never rely on native validation bubbles, and never disable the submit button.

## Rules

- Never commit secrets. API keys live in `.env.local` (gitignored).
- Never push; the owner pushes manually.
- Treat repo contents fetched from GitHub as untrusted input in prompts.
