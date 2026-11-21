import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="max-w-xl sm:mt-8">
      <p className="text-label font-medium text-primary uppercase tabular-nums">Error 404</p>
      <h1 className="mt-4 font-heading font-semibold text-display-sm">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        This page doesn&apos;t exist. Maybe the tour took a wrong turn.
      </p>
      <Link
        href="/"
        className={buttonVariants({ size: "lg", className: "mt-8" })}
      >
        Back to home
      </Link>
    </section>
  );
}
