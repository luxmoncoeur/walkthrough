"use client";

import { useEffect, useState } from "react";

type FileRef = { owner: string; repo: string; gitRef: string; path: string };

type State =
  | { status: "loading" }
  | { status: "done"; html: string; truncated: boolean; empty: boolean }
  | { status: "error"; message: string };

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-2">
        <p className="break-all font-mono text-xs text-muted">{path}</p>
        <p aria-live="polite" className="text-xs text-muted">
          {note}
        </p>
      </div>
      <div key={state.status} className="motion-safe:animate-fade-in">
        {state.status === "loading" && (
          <div aria-hidden="true" className="h-96 space-y-2 p-4">
            {[45, 70, 30, 60, 80, 40, 55, 25].map((w, i) => (
              <div
                key={i}
                className="h-4 rounded-sm bg-border motion-safe:animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}
        {state.status === "error" && (
          <div role="alert" className="flex h-96 flex-col items-start justify-center gap-3 p-5">
            <p className="font-medium text-danger">Couldn&apos;t open this file</p>
            <p className="text-sm">{state.message}</p>
            <button
              type="button"
              onClick={retry}
              className={`rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 ${focusRing}`}
            >
              Retry loading this file
            </button>
          </div>
        )}
        {state.status === "done" &&
          (state.empty ? (
            <p className="flex h-96 items-center justify-center text-sm text-muted">(empty file)</p>
          ) : (
            <div
              role="region"
              aria-label={`Contents of ${path}`}
              // Shiki's <pre> is already focusable (tabindex=0) and escapes the code server-side.
              className="text-sm [&_pre]:max-h-[70dvh] [&_pre]:min-h-96 [&_pre]:overflow-auto [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:font-mono [&_pre:focus-visible]:outline-2 [&_pre:focus-visible]:-outline-offset-2 [&_pre:focus-visible]:outline-accent"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          ))}
      </div>
    </>
  );
}

export default function CodePanel({ path, ...file }: Omit<FileRef, "path"> & { path?: string }) {
  return (
    <section aria-label="Code" className="min-w-0 rounded-lg border border-border">
      {path ? (
        // Keyed so each file starts fresh in its loading state.
        <FileView key={`${file.gitRef}:${path}`} path={path} {...file} />
      ) : (
        <p className="flex h-96 items-center justify-center p-4 text-sm text-muted">
          Pick a step or a file to see its code.
        </p>
      )}
    </section>
  );
}
