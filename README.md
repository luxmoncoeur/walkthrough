# Walkthrough

AI-generated guided tours of any codebase.

Point Walkthrough at a GitHub repo and it builds an interactive, step-by-step tour: it highlights files in a sensible order, explains each part in plain language, and traces how a request flows through the app.

**Status:** in progress. Capstone for the FlyRank AI Internship (Frontend AI Engineering track).

## Why

- Groupmates inherit code they didn't write and don't know where to start.
- Project defenses ask "explain this part," and reading a repo cold is slow.
- READMEs say *what* a project is, rarely *how the code fits together*.

## Planned features

- [ ] Paste a public GitHub repo URL → fetch the file tree
- [ ] AI picks the important files and orders them into a tour
- [ ] Step-by-step tour UI with syntax-highlighted code and focused line ranges
- [ ] Streaming plain-language explanations per step
- [ ] "Follow a request" mode: trace one feature end to end
- [ ] Shareable tour links

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Vercel AI SDK with Claude
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
| `ANTHROPIC_API_KEY` | Yes, for tour generation | Claude API key used to generate tours (not used by the skeleton yet). |

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Home: one-line pitch and a GitHub repo URL input (placeholder form, no submit logic yet). |
| `/tour/[owner]/[repo]` | Tour view: step list and code panel side by side on desktop, stacked on mobile. Placeholder steps for now. |
| `/about` | How it works, in three steps. |
| `/health` | Health check: live GitHub API rate limit (remaining / limit, reset time) and whether a token is configured. |
| any unknown route | Custom 404 page. |

## License

[MIT](LICENSE)
