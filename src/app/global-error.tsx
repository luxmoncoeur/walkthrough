"use client";

import { Geist, Geist_Mono } from "next/font/google";
import RouteError from "@/components/RouteError";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Replaces the root layout when it crashes, so it brings its own <html>, <body> and styles.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh bg-background px-4 font-sans text-foreground">
        <title>Something broke · Walkthrough</title>
        <main>
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
