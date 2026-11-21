import { bundledLanguages, codeToHtml, type BundledLanguage } from "shiki";

// Extensions Shiki doesn't recognise as language ids on their own.
const EXT_ALIASES: Record<string, string> = {
  cc: "cpp",
  h: "c",
  hpp: "cpp",
  ex: "elixir",
  exs: "elixir",
};
const FILENAMES: Record<string, string> = { dockerfile: "dockerfile", makefile: "makefile" };

/** Shiki language for a file path, or "text" (escaped, no colors) when unknown. */
export function languageFor(path: string): BundledLanguage | "text" {
  const name = path.split("/").pop()!.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  const id = FILENAMES[name] ?? EXT_ALIASES[ext] ?? ext;
  return id in bundledLanguages ? (id as BundledLanguage) : "text";
}

/**
 * Server-side highlighting. Shiki HTML-escapes the code, so the output is safe to inject.
 * No size guard: /api/file caps input at 200k chars, which Shiki handles in ~200ms (minified too).
 */
export function highlight(code: string, path: string): Promise<string> {
  return codeToHtml(code, { lang: languageFor(path), theme: "github-light" });
}
