import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

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
    <section className="max-w-3xl">
      <h1 className="font-heading font-semibold text-display-sm">How it works</h1>
      <ol className="mt-10 space-y-3">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Card className="grid gap-x-8 gap-y-2 px-6 py-6 sm:grid-cols-[3rem_1fr]">
              <span aria-hidden="true" className="inline-grid h-6 min-w-6 place-items-center rounded-md border px-1.5 text-xs font-medium tabular-nums w-fit border-primary/40 bg-primary/10 text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-heading font-semibold text-title">{step.title}</h2>
                <p className="mt-2 max-w-[60ch] text-muted-foreground">{step.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
