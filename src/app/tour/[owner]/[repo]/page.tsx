import type { Metadata } from "next";
import { Suspense } from "react";
import TourPlanner from "@/components/TourPlanner";

type Params = Promise<{ owner: string; repo: string }>;

// Static on purpose: per-repo metadata depends on request-time params, so Next streams it into <body>,
// where Lighthouse and non-JS crawlers miss it. The <h1> names the repo.
export const metadata: Metadata = {
  title: "Codebase tour",
  description: "A guided tour of a GitHub codebase: which files to read first, and why.",
};

// Awaited inside <Suspense> because cacheComponents treats dynamic params as request-time data.
async function TourHeading({ params }: { params: Params }) {
  const { owner, repo } = await params;
  return (
    <h1 className="break-all font-mono text-2xl font-semibold tracking-tight">
      {owner}/{repo}
    </h1>
  );
}

async function TourPlan({ params }: { params: Params }) {
  const { owner, repo } = await params;
  // key: a new repo gets a fresh chat instead of reusing the previous one.
  return <TourPlanner key={`${owner}/${repo}`} owner={owner} repo={repo} />;
}

export default function TourPage({ params }: { params: Params }) {
  return (
    // min-h-dvh: the tour streams in taller than a screen, so start the footer below the fold instead of shoving it down (CLS).
    <div className="min-h-dvh space-y-6">
      <div>
        <p className="text-sm text-muted">Tour of</p>
        <Suspense
          fallback={<p className="h-8 w-48 rounded-md bg-border" aria-hidden="true" />}
        >
          <TourHeading params={params} />
        </Suspense>
      </div>

      <Suspense
        fallback={<div className="h-106 rounded-lg border border-border" aria-hidden="true" />}
      >
        <TourPlan params={params} />
      </Suspense>
    </div>
  );
}
