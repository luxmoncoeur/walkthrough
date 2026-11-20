import Link from "next/link";

const linkClass =
  "rounded-sm px-2 py-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="rounded-sm text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Walkthrough
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-2 text-sm">
            <li>
              <Link href="/" className={linkClass}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className={linkClass}>
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
