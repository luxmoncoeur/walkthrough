import axe from "axe-core";
import { expect } from "vitest";

/** Fails the test with the rule ids and targets of any axe violation in `container`. */
export async function expectNoAxeViolations(container: Element) {
  // jsdom can't compute colors, so contrast is checked by Lighthouse instead.
  const { violations } = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
