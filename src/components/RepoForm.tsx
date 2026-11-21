"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseRepoUrl } from "@/lib/parseRepoUrl";

const EXAMPLES = ["vercel/next.js", "facebook/react", "sindresorhus/is"];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function RepoForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseRepoUrl(inputRef.current?.value ?? "");
    if (!result.ok) {
      setAttempted(true);
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setError("");
    router.push(
      `/tour/${encodeURIComponent(result.owner)}/${encodeURIComponent(result.repo)}`,
    );
  }

  function handleChange(value: string) {
    if (!attempted) return;
    const result = parseRepoUrl(value);
    setError(result.ok ? "" : result.error);
  }

  // Fills the field and submits through the same validation and navigation as typing it.
  function tryExample(repo: string) {
    if (!inputRef.current) return;
    inputRef.current.value = repo;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="max-w-xl">
      <form ref={formRef} noValidate onSubmit={handleSubmit}>
        <label htmlFor="repo" className="sr-only">
          GitHub repository URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            ref={inputRef}
            id="repo"
            name="repo"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="github.com/owner/repo"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "repo-error" : undefined}
            onChange={(e) => handleChange(e.target.value)}
            className="h-11 bg-card px-3.5 sm:flex-1 md:text-[0.9375rem]"
          />
          <Button type="submit" size="lg">
            Generate tour
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
        {/* Always mounted so screen readers pick up changes to the live region. */}
        <p
          id="repo-error"
          aria-live="polite"
          className="mt-2 text-sm text-destructive empty:hidden"
        >
          {error}
        </p>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <h2 className="text-muted-foreground">Try</h2>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((repo) => (
            <li key={repo}>
              <button
                type="button"
                onClick={() => tryExample(repo)}
                className={`rounded-md border bg-card/60 px-2.5 py-1 transition-colors hover:border-input hover:text-foreground text-muted-foreground ${focusRing}`}
              >
                {repo}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
