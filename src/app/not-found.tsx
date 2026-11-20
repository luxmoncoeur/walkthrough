import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-muted">
        This page doesn&apos;t exist. Maybe the tour took a wrong turn.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Back to home
      </Link>
    </section>
  );
}
