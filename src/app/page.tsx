export default function Home() {
  return (
    <section className="mx-auto max-w-2xl py-12 text-center sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        Understand any codebase in minutes.
      </h1>
      <p className="mt-4 text-lg text-muted">
        Paste a GitHub repo and get a step-by-step guided tour of how the code
        fits together.
      </p>
      {/* Native constraint validation; submit logic comes in a later ticket. */}
      <form className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="repo" className="sr-only">
          GitHub repository URL
        </label>
        <input
          id="repo"
          name="repo"
          type="url"
          required
          pattern="https://github\.com/[A-Za-z0-9\-]+/[\w.\-]+/?"
          title="A GitHub repo URL, like https://github.com/owner/repo"
          placeholder="https://github.com/owner/repo"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-5 py-3 font-medium text-accent-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Generate tour
        </button>
      </form>
    </section>
  );
}
