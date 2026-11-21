type DraftStep = { path?: string; reason?: string };

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
  return (
    <nav aria-label="Tour steps">
      <ol className="space-y-2">
        {steps.map((step, i) => {
          if (!step.path) return null;
          const name = step.path.split("/").pop();
          const isSelected = final && step.path === selected;
          const body = (
            <>
              <p className="font-medium">
                {i + 1}. {name}
              </p>
              <p className="break-all font-mono text-xs text-muted">{step.path}</p>
              {step.reason && <p className="mt-1 text-sm">{step.reason}</p>}
            </>
          );
          const box = `w-full rounded-md border p-3 text-left ${isSelected ? "border-accent bg-accent/5" : "border-border"}`;
          return (
            <li key={i} className="motion-safe:animate-fade-in">
              {final ? (
                <button
                  type="button"
                  aria-current={isSelected ? "step" : undefined}
                  onClick={() => onSelect(step.path!)}
                  className={`${box} hover:border-accent ${focusRing}`}
                >
                  {body}
                </button>
              ) : (
                <div className={`${box} opacity-70`}>{body}</div>
              )}
            </li>
          );
        })}
        {Array.from({ length: placeholders }, (_, i) => (
          <li
            key={`placeholder-${i}`}
            aria-hidden="true"
            className="h-20 rounded-md border border-border bg-border/40 motion-safe:animate-pulse"
          />
        ))}
      </ol>
    </nav>
  );
}
