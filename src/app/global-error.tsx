"use client";

import RouteError from "@/components/RouteError";
import { fontVariables } from "./fonts";
import "./globals.css";

// Replaces the root layout when it crashes, so it brings its own <html>, <body> and styles.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className={`dark ${fontVariables} antialiased`}>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <title>Something broke · Walkthrough</title>
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <RouteError
            error={error}
            retry={retry}
            title="Something broke"
            description="Walkthrough hit an unexpected error and couldn't load. Try again, or head back home."
          />
        </main>
      </body>
    </html>
  );
}
