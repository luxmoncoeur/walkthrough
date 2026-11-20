import { Suspense } from "react";

type Params = Promise<{ owner: string; repo: string }>;

const steps = [
  { title: "Entry point", file: "src/app/layout.tsx" },
  { title: "Home page", file: "src/app/page.tsx" },
  { title: "Data fetching", file: "src/lib/github.ts" },
  { title: "API route", file: "src/app/api/tour/route.ts" },
];

// Awaited inside <Suspense> because cacheComponents treats dynamic params as request-time data.
async function TourHeading({ params }: { params: Params }) {
  const { owner, repo } = await params;
  return (
    <h1 className="break-all font-mono text-2xl font-semibold tracking-tight">
      {owner}/{repo}
    </h1>
  );
}

export default function TourPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Tour of</p>
        <Suspense
          fallback={<p className="h-8 w-48 rounded-md bg-border" aria-hidden="true" />}
        >
          <TourHeading params={params} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Tour steps">
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li
                key={step.file}
                aria-current={i === 0 ? "step" : undefined}
                className={`rounded-md border p-3 ${i === 0 ? "border-accent" : "border-border"}`}
              >
                <p className="font-medium">
                  {i + 1}. {step.title}
                </p>
                <p className="break-all font-mono text-xs text-muted">
                  {step.file}
                </p>
              </li>
            ))}
          </ol>
        </nav>

        <section
          aria-label="Code"
          className="min-w-0 rounded-lg border border-border"
        >
          <p className="border-b border-border px-4 py-2 font-mono text-xs text-muted">
            {steps[0].file}
          </p>
          <pre className="overflow-x-auto p-4 font-mono text-sm">
            <code>{`export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
