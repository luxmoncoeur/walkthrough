export const SABOTAGE_MODES = ["midstream", "429", "malformed", "slow"] as const;
export type SabotageMode = (typeof SABOTAGE_MODES)[number];

type Env = { ENABLE_SABOTAGE?: string; NODE_ENV?: string; VERCEL_ENV?: string };

/**
 * Failure injection for testing and recording. Off unless ENABLE_SABOTAGE is exactly "1", and never in a
 * production build except a Vercel Preview deployment, so a stray env var can't break Production.
 * Unknown values are ignored.
 */
export function sabotageMode(value: unknown, env: Env): SabotageMode | null {
  if (env.ENABLE_SABOTAGE !== "1") return null;
  if (env.VERCEL_ENV === "production") return null;
  if (env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview") return null;
  return SABOTAGE_MODES.find((m) => m === value) ?? null;
}
