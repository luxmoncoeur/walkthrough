"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { OFFLINE, userMessage } from "@/lib/errors";
import type { getRepoTree } from "@/lib/tools/getRepoTree";
import type { planTour } from "@/lib/tools/planTour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CodePanel from "./CodePanel";
import FileTree from "./FileTree";
import TourSteps from "./TourSteps";

type TourMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<{ getRepoTree: typeof getRepoTree; planTour: ReturnType<typeof planTour> }>
>;

const label = "text-label font-medium uppercase";

function TreeSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-4xl" />
        <Skeleton className="h-5 w-28 rounded-4xl" />
      </div>
      <div className="mt-3 h-60 space-y-2.5 rounded-lg border bg-background/60 p-3 sm:h-72">
        {[60, 40, 75, 50, 35, 65, 45, 55].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
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
  focusRetry,
}: {
  message: string;
  note?: string;
  retryLabel: string;
  onRetry: () => void;
  focusRetry?: boolean;
}) {
  return (
    // Marked by the "Error" label and title, not just the red edge.
    <Card className="items-start gap-3 border-l-4 border-destructive px-5 py-5">
      <p className={`${label} text-destructive`}>Error</p>
      <p className="font-heading font-semibold text-title">Something went wrong</p>
      <p className="text-sm break-words text-foreground">{message}</p>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <Button
        type="button"
        onClick={onRetry}
        // After Stop, the Stop button unmounts; this keeps keyboard focus from falling to <body>.
        autoFocus={focusRetry}
        size="lg"
        className="mt-1"
      >
        {retryLabel}
      </Button>
    </Card>
  );
}

const RETRY_LABEL = "Retry generating the tour";
// Shown when retrying after partial output: there is no server-side stream store to resume from.
const STARTS_OVER = "This starts over: it fetches the file tree again, then re-plans the tour.";
const SLOW_AFTER_MS = 8_000;
const STOPPED = "You stopped generating the tour.";

export default function TourPlanner({ owner, repo }: { owner: string; repo: string }) {
  // The server ignores this unless ENABLE_SABOTAGE=1 (see docs/FAILURES.md).
  const sabotage = useSearchParams().get("sabotage") ?? undefined;
  const { messages, sendMessage, regenerate, stop, status, error } = useChat<TourMessage>({
    id: `tour:${owner}/${repo}`,
    transport: new DefaultChatTransport({
      api: "/api/tour",
      body: { owner, repo, sabotage },
      // The server ignores the message history, so don't send it (keeps the body under the route's 10 KB cap).
      prepareSendMessagesRequest: ({ body }) => ({ body: body ?? {} }),
    }),
  });
  const [offline, setOffline] = useState(false);
  const [stopped, setStopped] = useState(false);
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
    setStopped(false);
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

  function cancel() {
    setStopped(true);
    void stop();
  }
  const streaming = (status === "submitted" || status === "streaming") && !stopped;

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
    (offline ? OFFLINE : undefined) ?? (stopped ? STOPPED : undefined) ?? toolError ?? (error && userMessage(error)) ?? emptyFinish;

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
    <div className="space-y-10 sm:space-y-12">
      <section
        aria-labelledby="tour-plan-heading"
        className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
      >
        <h2 id="tour-plan-heading" className={`${label} text-muted-foreground`}>
          Tour plan
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {statusText}
          </p>
          {streaming && (
            <Button type="button" variant="outline" onClick={cancel} className="border-input">
              Stop generating
            </Button>
          )}
        </div>

        <div key={phase} className="mt-4 motion-safe:animate-fade-in">
          {phase === "preparing" && <TreeSkeleton />}

          {phase === "fetching" && treeTool?.state === "input-available" && (
            <div>
              <ul className="flex flex-wrap items-center gap-2" aria-label="Tool input">
                {Object.entries(treeTool.input).map(([key, value]) => (
                  <li key={key}>
                    <Badge variant="outline">
                      <span className="text-muted-foreground">{key}:</span> {value}
                    </Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex h-60 flex-col items-center justify-center gap-3 rounded-lg border bg-background/60 sm:h-72">
                <progress aria-label="Fetching file tree" className="h-1 w-1/2 accent-primary" />
                <p className="text-sm text-muted-foreground">Reading the repository tree from GitHub…</p>
              </div>
            </div>
          )}

          {phase === "tree" && tree && (
            <FileTree {...tree} selected={activePath} onSelectFile={setSelected} />
          )}

          {phase === "error" && errorMessage && (
            <div className="min-h-80">
              <ErrorCard
                message={errorMessage}
                retryLabel={RETRY_LABEL}
                onRetry={retry}
                focusRetry={stopped}
              />
            </div>
          )}
        </div>
      </section>

      {tree && (
        <div className="grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
          {/* The model can fail after the tree loaded (e.g. quota hit while planning). */}
          {errorMessage ? (
            <ErrorCard
              message={errorMessage}
              note={STARTS_OVER}
              retryLabel={RETRY_LABEL}
              onRetry={retry}
              focusRetry={stopped}
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
