// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import TourSteps from "./TourSteps";

afterEach(cleanup);

const steps = [
  { path: "src/index.ts", reason: "Entry point." },
  { path: "src/lib/util.ts", reason: "Helpers." },
];

describe("TourSteps", () => {
  it("while streaming: steps are plain text with placeholders, half-streamed paths hidden", async () => {
    const { container } = render(
      <TourSteps steps={[steps[0], { reason: "no path yet" }]} final={false} onSelect={vi.fn()} />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("1. index.ts")).toBeTruthy();
    expect(screen.queryByText("no path yet")).toBeNull();
    expect(container.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(3);
    await expectNoAxeViolations(container);
  });

  it("when final: steps are buttons, the selected one is aria-current, clicks select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <TourSteps steps={steps} final selected="src/index.ts" onSelect={onSelect} />,
    );
    const [first, second] = screen.getAllByRole("button");
    expect(first.getAttribute("aria-current")).toBe("step");
    expect(second.getAttribute("aria-current")).toBeNull();
    expect(container.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(0);
    await user.click(second);
    expect(onSelect).toHaveBeenCalledWith("src/lib/util.ts");
    await expectNoAxeViolations(container);
  });
});
