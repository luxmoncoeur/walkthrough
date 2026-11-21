// Home showcase: what a tour of this repo looks like. Static, server-rendered.
// Paths and code are real (src/lib/parseRepoUrl.ts lines 9-16), so the example never misrepresents anyone's code.
const FIRST_LINE = 9;
const FOCUS = [13, 14];
const CODE = [
  "export function parseRepoUrl(input: string): ParseRepoUrlResult {",
  "  const trimmed = input.trim();",
  '  if (!trimmed) return { ok: false, error: "Paste a GitHub repository URL." };',
  "",
  "  const withoutQuery = trimmed.split(/[?#]/)[0];",
  "  const hasProtocol = /^https?:\\/\\//i.test(withoutQuery);",
  "  const segments = withoutQuery",
  '    .replace(/^https?:\\/\\//i, "")',
];
const STOPS = [
  { n: "01", file: "RepoForm.tsx", note: "Where a pasted repo enters the app." },
  { n: "02", file: "parseRepoUrl.ts", note: "Turns any input into owner/repo, or one clear error.", active: true },
  { n: "03", file: "api/tour/route.ts", note: "Server route that asks the model to plan the tour." },
];

const windowClass = "overflow-hidden rounded-xl border bg-card/95";
const titleClass = "border-b px-4 py-2.5 text-center text-xs text-muted-foreground";

export default function ExampleTour() {
  return (
    <figure className="showcase relative isolate overflow-hidden rounded-2xl border p-4 sm:p-8 lg:p-10">
      <figcaption className="sr-only">Example: a tour of this repository, stopped at parseRepoUrl.ts</figcaption>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className={windowClass}>
          <p className={titleClass}>src/lib/parseRepoUrl.ts</p>
          <pre className="py-4 font-mono text-[0.8125rem] leading-6">
            <code>
              {CODE.map((line, i) => {
                const n = FIRST_LINE + i;
                const focused = n >= FOCUS[0] && n <= FOCUS[1];
                return (
                  // Long lines wrap under their own number instead of being clipped.
                  <span
                    key={n}
                    className={`flex border-l-2 pr-5 pl-3 ${focused ? "border-primary bg-primary/8" : "border-transparent"}`}
                  >
                    <span aria-hidden="true" className="mr-4 w-5 shrink-0 text-right text-faint select-none">
                      {n}
                    </span>
                    <span className="min-w-0 break-all whitespace-pre-wrap">{line || " "}</span>
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
        <div className={`${windowClass} lg:mt-10`}>
          <p className={titleClass}>
            Tour <span aria-hidden="true">·</span> <span className="tabular-nums">02 / 03</span>
          </p>
          <ol className="space-y-1 p-2">
            {STOPS.map((stop) => (
              <li
                key={stop.n}
                aria-current={stop.active ? "step" : undefined}
                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-lg px-3 py-3 ${stop.active ? "bg-muted" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-grid h-6 min-w-6 place-items-center rounded-md border px-1.5 text-xs font-medium tabular-nums ${stop.active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {stop.n}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{stop.file}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{stop.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  );
}
