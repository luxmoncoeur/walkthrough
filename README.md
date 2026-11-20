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

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Vercel AI SDK with Claude
- GitHub REST API for repo contents
- Deployed on Vercel

## Getting started

The app isn't scaffolded yet, so there's nothing to run. Once it is, you'll need:

- Node.js LTS and npm
- An Anthropic API key, for generating tours
- A GitHub personal access token (optional). It raises the GitHub API rate limit from 60 to 5,000 requests per hour.

Both keys go in `.env.local`, which is gitignored:

```bash
ANTHROPIC_API_KEY=your-key
GITHUB_TOKEN=your-token
```

Full install and run steps will be added with the scaffold.

## License

[MIT](LICENSE)
