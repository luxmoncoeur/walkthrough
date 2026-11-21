import type { Metadata } from "next";
import { Suspense } from "react";

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
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-3 last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

async function HealthStatus() {
  const token = process.env.GITHUB_TOKEN || undefined;
  const tokenLabel = token ? "yes" : "no";
  const result = await checkGitHub(token);

  if (!result.ok) {
    return (
      <div role="alert" className="rounded-lg border border-accent p-5">
        <p className="font-medium">Status: error</p>
        <p className="mt-1 text-muted">
          Couldn&apos;t reach the GitHub API
          {result.status ? ` (HTTP ${result.status})` : ""}. Check your network
          connection or token, then reload this page.
        </p>
        <dl className="mt-4">
          <Row label="Token configured" value={tokenLabel} />
        </dl>
      </div>
    );
  }

  const { core } = result;
  return (
    <dl className="rounded-lg border border-border px-5">
      <Row label="Status" value="ok" />
      <Row label="Core requests remaining" value={`${core.remaining} / ${core.limit}`} />
      <Row label="Resets at" value={new Date(core.reset * 1000).toUTCString()} />
      <Row label="Token configured" value={tokenLabel} />
    </dl>
  );
}

export default function HealthPage() {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">Health</h1>
      <p className="mt-2 text-muted">Live GitHub API rate limit for this server.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-muted">Checking GitHub API…</p>}>
          <HealthStatus />
        </Suspense>
      </div>
    </section>
  );
}
