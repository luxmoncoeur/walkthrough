import RepoForm from "@/components/RepoForm";

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
      <RepoForm />
    </section>
  );
}
