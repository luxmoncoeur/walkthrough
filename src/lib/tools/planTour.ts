import { tool } from "ai";
import { z } from "zod";

export const MAX_STEPS = 8;

export type TourStep = { path: string; reason: string };

export const planInputSchema = z.object({
  steps: z
    .array(
      z.object({
        path: z.string().describe("A file path copied exactly from the getRepoTree output"),
        reason: z.string().describe("One short sentence: why a newcomer should read this file"),
      }),
    )
    .min(1)
    .max(MAX_STEPS)
    .describe("5-8 files in the order a newcomer should read them"),
});

/** Keeps only paths that exist in the fetched tree (the model may invent some), without duplicates. */
export function keepKnownPaths(steps: TourStep[], files: string[]): TourStep[] {
  const known = new Set(files);
  const seen = new Set<string>();
  return steps
    .filter((s) => known.has(s.path) && !seen.has(s.path) && seen.add(s.path))
    .slice(0, MAX_STEPS);
}

/** `files` is read at execute time: the tree only exists after getRepoTree has run in this request. */
export function planTour(files: () => string[]) {
  return tool({
    description:
      "Record the tour: the files a newcomer should read first, in order, each with a one-sentence reason.",
    inputSchema: planInputSchema,
    execute: async ({ steps }): Promise<{ steps: TourStep[] }> => {
      const kept = keepKnownPaths(steps, files());
      if (kept.length === 0) throw new Error("The AI model didn't pick any files from the tree.");
      return { steps: kept };
    },
  });
}
