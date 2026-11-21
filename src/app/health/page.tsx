import type { Metadata } from "next";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Health",
  description: "Live GitHub API rate limit and configuration status for Walkthrough.",
};

type RateLimit = { limit: number; remaining: number; reset: number };

type Result =
  | { ok: true; core: RateLimit }
  | { ok: false; status?: number };

async function checkGitHub(token: string | undefined): Promise<Result> {
  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data: { resources?: { core?: RateLimit } } = await res.json();
    const core = data.resources?.core;
    if (typeof core?.remaining !== "number") return { ok: false, status: res.status };
    return { ok: true, core };
  } catch {
    return { ok: false };
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b py-3 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm tabular-nums">{value}</dd>
    </div>
  );
}

async function HealthStatus() {
  const token = process.env.GITHUB_TOKEN || undefined;
  const tokenLabel = token ? "yes" : "no";
  const result = await checkGitHub(token);

  if (!result.ok) {
    return (
      <Card role="alert" className="gap-0 border-l-4 border-destructive px-6 py-6">
        <p className="text-label font-medium text-destructive uppercase">Error</p>
        <p className="mt-2 font-heading font-semibold text-title">Status: error</p>
        <p className="mt-1 text-muted-foreground">
          Couldn&apos;t reach the GitHub API
          {result.status ? ` (HTTP ${result.status})` : ""}. Check your network
          connection or token, then reload this page.
        </p>
        <dl className="mt-4">
          <Row label="Token configured" value={tokenLabel} />
        </dl>
      </Card>
    );
  }

  const { core } = result;
  return (
    <Card className="py-2">
      <dl className="px-6">
        <Row label="Status" value="ok" />
        <Row label="Core requests remaining" value={`${core.remaining} / ${core.limit}`} />
        <Row label="Resets at" value={new Date(core.reset * 1000).toUTCString()} />
        <Row label="Token configured" value={tokenLabel} />
      </dl>
    </Card>
  );
}

export default function HealthPage() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-heading font-semibold text-display-sm">Health</h1>
      <p className="mt-4 text-muted-foreground">Live GitHub API rate limit for this server.</p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-muted-foreground">Checking GitHub API…</p>}>
          <HealthStatus />
        </Suspense>
      </div>
    </section>
  );
}
