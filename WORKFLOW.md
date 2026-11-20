# FE-03 workflow: vague prompt vs precise prompt

Same ticket (validate the repo URL form on the home page), two prompts, two branches. Diffs are against `main`.

## Setup

- **Round 1** (`fe03/round-1-vague`, commit `dc44d68`): "add validation to the repo url form"
- **Round 2** (`fe03/round-2-precise`, commits `2f34389`, `0f78d3b`): the full spec, quoted in the appendix.

Round 1 changed 1 file (+4/−1). Round 2 changed 7 files (+718/−24, of which 545 are `package-lock.json`).

## Correctness

Round 1 added three attributes to the existing input in `src/app/page.tsx:19-22`: `type="url"`, `required`, and `pattern="https://github\.com/[A-Za-z0-9\-]+/[\w.\-]+/?"`. The form still has no `action` or `onSubmit` (`page.tsx:12`), so a valid URL submits a GET to `/?repo=...` and reloads the home page. It never reaches `/tour/[owner]/[repo]`.

Round 2 moved the logic into a pure function, `src/lib/parseRepoUrl.ts`, and on success calls `router.push` to the tour route (`src/components/RepoForm.tsx:23`). There are 26 Vitest cases in `src/lib/parseRepoUrl.test.ts`. Round 1 has no tests.

## Accessibility

Round 1 relies on the browser's built-in error bubble plus a `title` tooltip (`page.tsx:22`). Nothing in the markup links the message to the input, and the message disappears when the bubble closes.

Round 2 turns off browser validation with `noValidate` (`RepoForm.tsx:36`). It sets `aria-invalid` and `aria-describedby` on the input (`:53-54`), keeps the error in an `aria-live="polite"` paragraph that is always mounted (`:61`), moves focus back to the input (`:19`), and adds a `--color-danger` token (`globals.css:11`).

## Edge cases

| Input               | Round 1                                 | Round 2                                                             |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `vercel/next.js`    | Blocked by `type="url"`: not a URL      | Accepted (shorthand)                                                |
| `gitlab.com/a/b`    | Browser's "enter a URL" message         | "Only GitHub repositories are supported." (`parseRepoUrl.ts:21-23`) |
| `github.com/vercel` | Browser's "enter a URL" message         | "That URL is missing the repository name."                          |
| Empty submit        | Browser's "fill out this field" message | "Paste a GitHub repository URL."                                    |
| Keyboard only       | Bubble shows, then disappears           | Error stays visible, focus returns to the input                     |

Round 1's `pattern` also rejects `http://`, `www.`, `?query`, `#hash` and `/tree/main/...`. It accepts owners with a leading hyphen and owners over 39 characters. Round 2 handles all of these (`parseRepoUrl.ts:5-6, 13, 34-35`).

## Review effort and time

- Round 1: [8] min. The diff is small, but reviewing it meant knowing how `type="url"` and `pattern` behave in each browser.
- Round 2: [6] min including review. The diff is bigger, but each rule in the spec maps to one line or one test row.

## AI mistake I caught

Round 1's form has no submit handler (page.tsx:12 on that branch). I tested it in the browser: I entered https://github.com/vercel/next.js, pressed Enter, and the page just reloaded as /?repo=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js instead of opening the tour. Reading the diff alone, it looked correct; only running it showed that it never navigates.

## Takeaway

The vague prompt produced code that looks finished but blocks the main input format (`owner/repo`) and never navigates anywhere. The precise prompt worked because it listed the exact inputs, the exact error messages, and the accessibility attributes. Each of those became something I could check in review. Writing the spec took longer than writing the vague prompt, but review time dropped because I was checking items off a list instead of finding the requirements as I read.

---

## Appendix: prompts verbatim

### Round 1

> add validation to the repo url form

### Round 2

> Read CLAUDE.md first. This is FE-03 round two: implement validation for the repo URL form on the home page.
>
> Current state: `src/app/page.tsx` is a Server Component with a static <form> (input id="repo", type="url", no submit logic). `src/app/tour/[owner]/[repo]/page.tsx` already exists.
>
> Build:
>
> 1. `src/lib/parseRepoUrl.ts`: a pure function
>    `parseRepoUrl(input: string): { ok: true; owner: string; repo: string } | { ok: false; error: string }`
>    ACCEPT (all → owner "vercel", repo "next.js"):
>    - `https://github.com/vercel/next.js`
>    - `http://github.com/vercel/next.js` and `https://www.github.com/vercel/next.js`
>    - `github.com/vercel/next.js` (no protocol)
>    - `vercel/next.js` (shorthand)
>    - trailing slash, a `.git` suffix, `?query` or `#hash`, and deep paths like `/tree/main/packages` (keep only the first two segments)
>    - surrounding whitespace (trim it)
>      REJECT with these exact messages:
>    - empty or whitespace only → "Paste a GitHub repository URL."
>    - any host other than github.com → "Only GitHub repositories are supported."
>    - owner but no repo (`github.com/vercel`) → "That URL is missing the repository name."
>    - invalid owner (must be 1–39 chars, letters/digits/hyphens, no leading or trailing hyphen) or invalid repo (1–100 chars of letters, digits, `.`, `_`, `-`, and not `.` or `..`) → "That doesn't look like a valid owner/repo."
> 2. `src/components/RepoForm.tsx`: a Client Component (the only "use client" file) that replaces the inline form in page.tsx. page.tsx stays a Server Component.
>    - Use `type="text"` with `inputMode="url"`, `autoComplete="off"` and `spellCheck={false}`, because `type="url"` would block the `owner/repo` shorthand through native browser validation.
>    - Validate on submit. After the first failed submit, re-validate as the user types so the error clears once fixed.
>    - Errors: inline message under the input, linked with `aria-describedby`, `aria-invalid` on the input, the message inside an `aria-live="polite"` region, and focus moved back to the input. Never disable the submit button.
>    - On success: `router.push` to `/tour/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`.
>    - Keep the existing Tailwind classes and design tokens. Error text uses an existing token; add a `--color-danger` token in globals.css only if none fits.
> 3. Tests: add Vitest as a dev dependency (the only new dependency allowed) plus a `"test": "vitest run"` script. Create `src/lib/parseRepoUrl.test.ts` as a table-driven test covering EVERY accept and reject example above.
>
> Verify: write the code, then run `npm test`, `npm run lint` and `npm run build`. Fix anything that fails and rerun until all three pass. Then list the manual checks I should do in the browser (keyboard only, screen at 375px, each error message).
>
> Do NOT commit or push. I commit myself. At the end, suggest how to split the changes into 2–3 Conventional Commits, with the file list for each.
