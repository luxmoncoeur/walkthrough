# Reflection

## What I built

Walkthrough turns any public GitHub repo into a guided tour: the AI reads the file tree, picks 5–8 files in reading order, and explains why each one matters while the code opens beside it. I built it for students who inherit a groupmate's project or have to explain code during a defense, and it's live at https://walkthrough-proj.vercel.app with 191 tests and Lighthouse scores of 100.

## What went well

I'm proudest of the pipeline from repo to tour. Instead of letting the model write free text, one tool fetches the repo through the GitHub API and a second forces the AI to return structured steps that are checked against the real file list, so it can't invent files and each step streams into the UI as it's planned.

## What was hard

Error handling, testing and rate limiting took the longest. I wrote a 16-case failure inventory and added a Preview-only "sabotage" switch that forces failures, which exposed a bug where Retry kept resending the broken request. Rate limiting works, but it lives in memory and resets per server instance, so I documented that limit instead of hiding it.

## How I used AI (what worked and what didn't)

Claude Code did most of the building, and it worked best when I gave it precise rules and worst when I left things vague. I checked everything it wrote by running the tests constantly, calling every preview deployment with curl, and clicking through each error state myself. The UI was the hardest part, since getting a design that didn't look generic took several rounds.

## What I'd do differently

I'd choose the visual direction at the start, because redesigning at the end touched almost every component. I'd also write tests alongside each feature instead of in one batch, and keep my Git history cleaner: I once merged the wrong PR and had to revert it.

## What's next

I want Walkthrough to feel less like a list of files and more like a guide that walks you through the code, highlights the exact lines that matter, and explains them as you go. After that I'd add a mode that traces one feature end to end, plus shareable tour links.
