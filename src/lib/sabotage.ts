export const SABOTAGE_MODES = ["midstream", "429", "malformed", "slow"] as const;
export type SabotageMode = (typeof SABOTAGE_MODES)[number];

/**
 * Failure injection for testing and recording. Off unless ENABLE_SABOTAGE is exactly "1"
 * (Preview/Development only, never Production); unknown values are ignored.
 */
export function sabotageMode(
  value: unknown,
  enableSabotage: string | undefined,
): SabotageMode | null {
  if (enableSabotage !== "1") return null;
  return SABOTAGE_MODES.find((m) => m === value) ?? null;
}
