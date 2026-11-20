"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseRepoUrl } from "@/lib/parseRepoUrl";

export default function RepoForm() {
  const router = useRouter();
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

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="min-w-0 flex-1 text-left">
        <label htmlFor="repo" className="sr-only">
          GitHub repository URL
        </label>
        <input
          ref={inputRef}
          id="repo"
          name="repo"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://github.com/owner/repo"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "repo-error" : undefined}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full rounded-md border bg-background px-4 py-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${error ? "border-danger" : "border-border"}`}
        />
        {/* Always mounted so screen readers pick up changes to the live region. */}
        <p
          id="repo-error"
          aria-live="polite"
          className="mt-2 text-sm text-danger empty:hidden"
        >
          {error}
        </p>
      </div>
      <button
        type="submit"
        className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Generate tour
      </button>
    </form>
  );
}
