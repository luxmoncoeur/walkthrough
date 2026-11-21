import BlurText from "@/components/BlurText";
import ExampleTour from "@/components/ExampleTour";
import RepoForm from "@/components/RepoForm";

export default function Home() {
  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="hero-backdrop" />
      <section>
        <p className="inline-flex items-center gap-2 rounded-lg border bg-card/60 p-1 pr-3 text-sm">
          <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background">Beta</span>
          Guided tours for any public GitHub repo
        </p>
        <h1 className="mt-7 max-w-[43rem] font-heading text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[3.5rem]">
          <BlurText
            text="Understand any codebase in minutes."
            trigger="load"
            delay={50}
            stepDuration={0.3}
            blur={6}
            distance={10}
          />
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
          <RepoForm />
          <p className="text-pretty text-muted-foreground lg:text-right">
            Paste a repo. Get the files to read first, in order, with why each one matters.
          </p>
        </div>
      </section>
      <div className="mt-14 sm:mt-16">
        <ExampleTour />
      </div>
    </div>
  );
}
