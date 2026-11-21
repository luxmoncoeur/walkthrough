"use client";

import { useEffect, useState } from "react";
import { FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type FileRef = { owner: string; repo: string; gitRef: string; path: string };

type State =
  | { status: "loading" }
  | { status: "done"; html: string; truncated: boolean; empty: boolean }
  | { status: "error"; message: string };

function FileView({ owner, repo, gitRef, path }: FileRef) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ owner, repo, ref: gitRef, path });
    fetch(`/api/file?${query}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.ok) {
          const { html, truncated, empty } = await res.json();
          setState({ status: "done", html, truncated, empty });
        } else {
          setState({ status: "error", message: (await res.text()) || "Couldn't load this file." });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: "Couldn't load this file. Check your connection." });
        }
      });
    // Aborting also makes rapid double Retry clicks harmless: only the last request lands.
    return () => controller.abort();
  }, [owner, repo, gitRef, path, attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  const note =
    state.status === "loading"
      ? "Loading…"
      : state.status === "done" && state.truncated
        ? "Large file: showing the first 200,000 characters."
        : "";

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-background/50 px-4 py-2.5 sm:px-6">
        <p className="text-xs break-all">{path}</p>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {note}
        </p>
      </div>
      <div key={state.status} className="motion-safe:animate-fade-in">
        {state.status === "loading" && (
          <div aria-hidden="true" className="h-96 space-y-2.5 p-6">
            {[45, 70, 30, 60, 80, 40, 55, 25].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {state.status === "error" && (
          <div role="alert" className="flex h-96 flex-col items-start justify-center gap-3 p-6">
            <p className="text-label font-medium text-destructive uppercase">Error</p>
            <p className="font-heading font-semibold text-title">Couldn&apos;t open this file</p>
            <p className="text-sm">{state.message}</p>
            <Button
              type="button"
              onClick={retry}
              size="lg"
              className="mt-1"
            >
              Retry loading this file
            </Button>
          </div>
        )}
        {state.status === "done" &&
          (state.empty ? (
            <p className="flex h-96 items-center justify-center text-sm text-muted-foreground">(empty file)</p>
          ) : (
            <div
              role="region"
              aria-label={`Contents of ${path}`}
              // Shiki's <pre> is already focusable (tabindex=0) and escapes the code server-side.
              className="code-frame text-sm [&_pre]:max-h-[70dvh] [&_pre]:min-h-96 [&_pre]:overflow-auto [&_pre]:bg-transparent! [&_pre]:px-4 [&_pre]:py-6 sm:[&_pre]:px-6 [&_pre]:font-mono [&_pre:focus-visible]:outline-2 [&_pre:focus-visible]:-outline-offset-2 [&_pre:focus-visible]:outline-ring"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          ))}
      </div>
    </Card>
  );
}

export default function CodePanel({ path, ...file }: Omit<FileRef, "path"> & { path?: string }) {
  return (
    <section aria-label="Code" className="min-w-0">
      {path ? (
        // Keyed so each file starts fresh in its loading state.
        <FileView key={`${file.gitRef}:${path}`} path={path} {...file} />
      ) : (
        <div className="flex h-96 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input p-4 text-center">
          <FileCode2 aria-hidden="true" className="size-6 text-faint" />
          <p className="text-sm text-muted-foreground">Pick a step or a file to see its code.</p>
        </div>
      )}
    </section>
  );
}
