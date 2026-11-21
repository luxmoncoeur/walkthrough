"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <Card className="max-w-xl gap-0 border-l-4 border-destructive px-6 py-6 sm:mt-8 sm:px-8 sm:py-8">
      <p className="text-label font-medium text-destructive uppercase">Error</p>
      <h1 className="mt-4 font-heading font-semibold text-display-sm text-balance">{title}</h1>
      <p className="mt-4 text-pretty text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={retry} size="lg">
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "border-input" })}>
          Back to home
        </Link>
      </div>
    </Card>
  );
}
