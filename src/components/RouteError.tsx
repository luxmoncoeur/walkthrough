"use client";

import Link from "next/link";
import { useEffect } from "react";

const button =
  "rounded-md px-5 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Shared body of the route error boundaries. Never shows error details or stack traces. */
export default function RouteError({
  error,
  retry,
  title,
  description,
}: {
  error: unknown;
  retry: () => void;
  title: string;
  description: string;
}) {
  // Details stay in the console (and server logs via error.digest), not on the page.
  useEffect(() => console.error(error), [error]);

  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-sm text-danger">Error</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          className={`${button} bg-accent text-accent-foreground hover:opacity-90`}
        >
          Try again
        </button>
        <Link href="/" className={`${button} border border-border hover:bg-border/60`}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
