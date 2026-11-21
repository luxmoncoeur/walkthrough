import { z } from "zod";
import { OWNER_RE, REPO_RE } from "./parseRepoUrl";

export const repoInputSchema = z.object({
  owner: z
    .string()
    .regex(OWNER_RE)
    .describe("GitHub user or organization that owns the repository, e.g. vercel"),
  repo: z
    .string()
    .regex(REPO_RE)
    .refine((r) => r !== "." && r !== "..")
    .describe("Repository name without the owner, e.g. next.js"),
});

// Relative, slash-separated, no empty/"."/".." segments: blocks traversal out of the repo contents API.
const safePath = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((p) => p.split("/").every((s) => s !== "" && s !== "." && s !== ".."));

export const fileQuerySchema = repoInputSchema.extend({
  ref: safePath(255).refine((r) => !/\s/.test(r)),
  path: safePath(1000),
});
