import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Header() {
  return (
    // relative z-10 + solid bg: decorative backdrops on the page (home grid) never paint over the header.
    <header className="relative z-10 border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm font-heading text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {/* The mark: a stop number, like the tour's wall labels. */}
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md bg-primary text-[0.625rem] text-primary-foreground"
          >
            01
          </span>
          Walkthrough
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-1">
            <li>
              <Link href="/" className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}>
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
