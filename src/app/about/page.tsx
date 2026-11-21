import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Walkthrough reads a GitHub repo, picks the files to start with, and turns them into a guided tour.",
};

const steps = [
  {
    title: "Paste a repo",
    body: "Give Walkthrough the URL of any public GitHub repository.",
  },
  {
    title: "AI plans the tour",
    body: "Claude reads the file tree, picks the important files and puts them in a sensible order.",
  },
  {
    title: "Step through it",
    body: "Follow the tour one step at a time, with the relevant code and a plain-language explanation side by side.",
  },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
      <ol className="mt-8 space-y-4">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-lg border border-border p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-sm text-accent-foreground"
            >
              {i + 1}
            </span>
            <div>
              <h2 className="font-medium">{step.title}</h2>
              <p className="mt-1 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
