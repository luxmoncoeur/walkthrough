import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type DraftStep = { path?: string; reason?: string };

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const pad = (n: number) => String(n).padStart(2, "0");

/** Wall-label row for a path: its folder (or "root") and extension, e.g. "src/lib / ts". */
function labelFor(path: string) {
  const parts = path.split("/");
  const name = parts.pop()!;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return [parts.join("/") || "root", ext].filter(Boolean).join(" / ");
}

/**
 * Steps stream in while the model writes them; they only become buttons once final,
 * because a half-streamed path would point at a file that doesn't exist.
 */
export default function TourSteps({
  steps,
  final,
  selected,
  onSelect,
}: {
  steps: DraftStep[];
  final: boolean;
  selected?: string;
  onSelect: (path: string) => void;
}) {
  const placeholders = final ? 0 : Math.max(1, 5 - steps.length);
  const current = final ? steps.findIndex((s) => s.path === selected) : -1;
  return (
    <nav aria-label="Tour steps">
      <div className="flex h-6 items-center justify-between">
        <p className="text-label font-medium text-muted-foreground uppercase">Stops</p>
        {current >= 0 && (
          <Badge variant="secondary" className="tabular-nums">
            <span aria-hidden="true">
              {pad(current + 1)} / {pad(steps.length)}
            </span>
            <span className="sr-only">
              Stop {current + 1} of {steps.length}
            </span>
          </Badge>
        )}
      </div>
      <ol className="mt-3 space-y-1">
        {steps.map((step, i) => {
          if (!step.path) return null;
          const name = step.path.split("/").pop();
          const isSelected = final && step.path === selected;
          const body = (
            <>
              {isSelected && (
                // The active stop's edge; a shape cue alongside aria-current and the green number.
                <span
                  aria-hidden="true"
                  className="absolute inset-y-3 left-0 w-0.5 origin-top rounded-full bg-primary motion-safe:animate-rule-in"
                />
              )}
              <span
                aria-hidden="true"
                className={`inline-grid h-6 min-w-6 place-items-center rounded-md border px-1.5 text-xs font-medium tabular-nums ${isSelected ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {pad(i + 1)}
              </span>
              {/* Spans, not <p>: buttons may only hold phrasing content. */}
              <span className="block min-w-0">
                <span className={`block break-all ${isSelected ? "font-semibold" : "font-medium"}`}>
                  <span className="sr-only">Stop {i + 1}: </span>
                  {name}
                </span>
                <span className="mt-0.5 block text-xs break-all text-muted-foreground">{labelFor(step.path)}</span>
                {step.reason && (
                  <span className="mt-2 block text-sm text-pretty text-muted-foreground">{step.reason}</span>
                )}
              </span>
            </>
          );
          const box = "relative grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-lg px-4 py-3.5 text-left";
          return (
            <li key={i} className="motion-safe:animate-fade-in">
              {final ? (
                <button
                  type="button"
                  aria-current={isSelected ? "step" : undefined}
                  onClick={() => onSelect(step.path!)}
                  className={`${box} transition-colors ${isSelected ? "bg-card ring-1 ring-foreground/10" : "hover:bg-muted/60"} ${focusRing}`}
                >
                  {body}
                </button>
              ) : (
                // Dashed, not faded, while streaming: opacity would drop the muted text below AA contrast.
                <div className={`${box} border border-dashed border-input`}>{body}</div>
              )}
            </li>
          );
        })}
        {Array.from({ length: placeholders }, (_, i) => (
          <li key={`placeholder-${i}`} aria-hidden="true" className="space-y-2 px-4 py-3.5">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </li>
        ))}
      </ol>
    </nav>
  );
}
