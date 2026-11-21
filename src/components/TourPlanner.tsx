"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { OFFLINE, userMessage } from "@/lib/errors";
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Skeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-2">
        <div className="h-5.5 w-16 rounded-full bg-border motion-safe:animate-pulse" />
        <div className="h-5.5 w-28 rounded-full bg-border motion-safe:animate-pulse" />
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

function ErrorCard({
  message,
  note,
  retryLabel,
  onRetry,
}: {
  message: string;
  note?: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start justify-center gap-3 rounded-md border border-danger p-5">
      <p className="font-medium text-danger">Something went wrong</p>
      <p className="text-sm break-words text-foreground">{message}</p>
      {note && <p className="text-sm text-muted">{note}</p>}
      <button
        type="button"
        onClick={onRetry}
        className={`rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 ${focusRing}`}
      >
        {retryLabel}
      </button>
    </div>
  );
}

const RETRY_LABEL = "Retry generating the tour";
// Shown when retrying after partial output: there is no server-side stream store to resume from.
const STARTS_OVER = "This starts over: it fetches the file tree again, then re-plans the tour.";
const SLOW_AFTER_MS = 8_000;

export default function TourPlanner({ owner, repo }: { owner: string; repo: string }) {
  // The server ignores this unless ENABLE_SABOTAGE=1 (see docs/FAILURES.md).
  const sabotage = useSearchParams().get("sabotage") ?? undefined;
  const { messages, sendMessage, regenerate, status, error } = useChat<TourMessage>({
    id: `tour:${owner}/${repo}`,
    transport: new DefaultChatTransport({ api: "/api/tour", body: { owner, repo, sabotage } }),
  });
  const [offline, setOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Deferred one tick: Strict Mode's simulated unmount clears the first timer (and useChat's
  // cleanup calls chat.stop()), so exactly one request goes out, after the final mount.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!navigator.onLine) return setOffline(true);
      void sendMessage({ text: `Plan a tour of ${owner}/${repo}` });
    }, 0);
    return () => clearTimeout(id);
  }, [sendMessage, owner, repo]);

  // sendMessage/regenerate are async and don't flip status synchronously, so lock against double clicks.
  const retrying = useRef(false);
  function retry() {
    if (retrying.current) return;
    if (!navigator.onLine) return setOffline(true);
    setOffline(false);
    setAttempt((n) => n + 1);
    retrying.current = true;
    // Sabotage hits the first attempt only; retries run clean so the recovery path can be shown.
    const options = { body: { sabotage: null } };
    // Nothing sent yet (we were offline on mount) → first send; otherwise resend only the failed request.
    const request =
      messages.length === 0
        ? sendMessage({ text: `Plan a tour of ${owner}/${repo}` }, options)
        : regenerate(options);
    void request.finally(() => {
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
      ? userMessage(treeTool.errorText)
      : planTool?.state === "output-error"
        ? userMessage(planTool.errorText)
        : undefined;
  // Timeouts arrive as errors (the route converts them), so a clean finish without a plan means
  // the model skipped a tool or wrote no steps.
  const emptyFinish =
    status === "ready" && assistant && !(tree && plan)
      ? "The AI finished without picking any files to tour."
      : undefined;
  const errorMessage =
    (offline ? OFFLINE : undefined) ?? toolError ?? (error && userMessage(error)) ?? emptyFinish;

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

  // One timer per waiting phase of each attempt; "slow" flips only if it is still showing after SLOW_AFTER_MS.
  const waiting = !errorMessage && !plan ? `${attempt}:${phase}` : undefined;
  const [slowPhase, setSlowPhase] = useState<string>();
  useEffect(() => {
    if (!waiting) return;
    const id = setTimeout(() => setSlowPhase(waiting), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, [waiting]);
  const slowNote =
    waiting && slowPhase === waiting ? " Still working: big repos can take up to 25 seconds." : "";

  const statusText = errorMessage
    ? `Error: ${errorMessage}`
    : (phase === "preparing"
        ? "Preparing request…"
        : phase === "fetching"
          ? `Fetching file tree for ${owner}/${repo}`
          : plan
            ? `Loaded ${tree!.totalFiles} files. Tour ready: ${plan.steps.length} steps.`
            : `Loaded ${tree!.totalFiles} files. Choosing where to start…`) + slowNote;

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
                    className="rounded-full border border-accent px-2 py-0.5 font-mono text-xs break-all text-accent"
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
              <ErrorCard message={errorMessage} retryLabel={RETRY_LABEL} onRetry={retry} />
            </div>
          )}
        </div>
      </section>

      {tree && (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          {/* The model can fail after the tree loaded (e.g. quota hit while planning). */}
          {errorMessage ? (
            <ErrorCard
              message={errorMessage}
              note={STARTS_OVER}
              retryLabel={RETRY_LABEL}
              onRetry={retry}
            />
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
