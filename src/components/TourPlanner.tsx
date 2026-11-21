"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import type { getRepoTree } from "@/lib/tools/getRepoTree";
import type { planTour } from "@/lib/tools/planTour";
import CodePanel from "./CodePanel";
import FileTree from "./FileTree";
import TourSteps from "./TourSteps";

type TourMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<{ getRepoTree: typeof getRepoTree; planTour: ReturnType<typeof planTour> }>
>;

// The SDK stringifies thrown Errors, so errorText arrives as "Error: <message>".
const cleanError = (text: string) => text.replace(/^Error: /, "");

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Skeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-border motion-safe:animate-pulse" />
        <div className="h-5 w-28 rounded-full bg-border motion-safe:animate-pulse" />
      </div>
      <div className="mt-3 h-72 space-y-2 rounded-md border border-border p-3">
        {[60, 40, 75, 50, 35, 65, 45, 55].map((w, i) => (
          <div
            key={i}
            className="h-4 rounded-sm bg-border motion-safe:animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start justify-center gap-3 rounded-md border border-danger p-5">
      <p className="font-medium text-danger">Something went wrong</p>
      <p className="text-sm text-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={`rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 ${focusRing}`}
      >
        Retry
      </button>
    </div>
  );
}

export default function TourPlanner({ owner, repo }: { owner: string; repo: string }) {
  const { messages, sendMessage, regenerate, status, error } = useChat<TourMessage>({
    id: `tour:${owner}/${repo}`,
    transport: new DefaultChatTransport({ api: "/api/tour", body: { owner, repo } }),
  });

  // Deferred one tick: Strict Mode's simulated unmount clears the first timer (and useChat's
  // cleanup calls chat.stop()), so exactly one request goes out, after the final mount.
  useEffect(() => {
    const id = setTimeout(() => void sendMessage({ text: `Plan a tour of ${owner}/${repo}` }), 0);
    return () => clearTimeout(id);
  }, [sendMessage, owner, repo]);

  // regenerate() is async and doesn't flip status synchronously, so lock against double clicks.
  const retrying = useRef(false);
  function retry() {
    if (retrying.current) return;
    retrying.current = true;
    void regenerate().finally(() => {
      retrying.current = false;
    });
  }

  const [selected, setSelected] = useState<string>();

  const last = messages.at(-1);
  const assistant = last?.role === "assistant" ? last : undefined;
  const treeTool = assistant?.parts.find((p) => p.type === "tool-getRepoTree");
  const planTool = assistant?.parts.find((p) => p.type === "tool-planTour");

  const tree = treeTool?.state === "output-available" ? treeTool.output : undefined;
  const plan = planTool?.state === "output-available" ? planTool.output : undefined;
  const toolError =
    treeTool?.state === "output-error"
      ? cleanError(treeTool.errorText)
      : planTool?.state === "output-error"
        ? cleanError(planTool.errorText)
        : undefined;
  // The stream can finish without a result (server timeout, or the model skipped a tool).
  const emptyFinish =
    status === "ready" && assistant && !(tree && plan)
      ? "The AI model didn't respond in time. It may be busy; try again."
      : undefined;
  const errorMessage = toolError ?? error?.message ?? emptyFinish;

  // Steps stream in as the model writes the planTour input; the validated output replaces them.
  const draftSteps =
    planTool?.state === "input-streaming" || planTool?.state === "input-available"
      ? (planTool.input?.steps ?? []).flatMap((s) => (s ? [s] : []))
      : [];
  const activePath = selected ?? plan?.steps[0]?.path;

  const phase = tree
    ? "tree"
    : errorMessage
      ? "error"
      : treeTool?.state === "input-available"
        ? "fetching"
        : "preparing";

  const statusText = errorMessage
    ? `Error: ${errorMessage}`
    : phase === "preparing"
      ? "Preparing request…"
      : phase === "fetching"
        ? `Fetching file tree for ${owner}/${repo}`
        : plan
          ? `Loaded ${tree!.totalFiles} files. Tour ready: ${plan.steps.length} steps.`
          : `Loaded ${tree!.totalFiles} files. Choosing where to start…`;

  return (
    <div className="space-y-6">
      <section aria-labelledby="tour-plan-heading" className="rounded-lg border border-border p-4">
        <h2 id="tour-plan-heading" className="text-lg font-semibold">
          Tour plan
        </h2>
        <p aria-live="polite" className="mt-1 text-sm text-muted">
          {statusText}
        </p>

        <div key={phase} className="mt-4 motion-safe:animate-fade-in">
          {phase === "preparing" && <Skeleton />}

          {phase === "fetching" && treeTool?.state === "input-available" && (
            <div>
              <ul className="flex flex-wrap items-center gap-2" aria-label="Tool input">
                {Object.entries(treeTool.input).map(([key, value]) => (
                  <li
                    key={key}
                    className="rounded-full border border-accent px-2 py-0.5 font-mono text-xs text-accent"
                  >
                    {key}: {value}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex h-72 flex-col items-center justify-center gap-3 rounded-md border border-border">
                <progress aria-label="Fetching file tree" className="h-1.5 w-1/2 accent-accent" />
                <p className="text-sm text-muted">Reading the repository tree from GitHub…</p>
              </div>
            </div>
          )}

          {phase === "tree" && tree && (
            <FileTree {...tree} selected={activePath} onSelectFile={setSelected} />
          )}

          {phase === "error" && errorMessage && (
            <div className="min-h-80">
              <ErrorCard message={errorMessage} onRetry={retry} />
            </div>
          )}
        </div>
      </section>

      {tree && (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          {/* The model can fail after the tree loaded (e.g. quota hit while planning). */}
          {errorMessage ? (
            <ErrorCard message={errorMessage} onRetry={retry} />
          ) : (
            <TourSteps
              steps={plan?.steps ?? draftSteps}
              final={!!plan}
              selected={activePath}
              onSelect={setSelected}
            />
          )}
          <CodePanel owner={owner} repo={repo} gitRef={tree.defaultBranch} path={activePath} />
        </div>
      )}
    </div>
  );
}
