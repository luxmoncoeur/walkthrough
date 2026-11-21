// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { APICallError } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OFFLINE } from "@/lib/errors";
import { TOO_MANY } from "@/lib/rateLimit";
import { expectNoAxeViolations } from "@/test/axe";
import TourPlanner from "./TourPlanner";

type Chat = {
  messages: unknown[];
  status: "submitted" | "streaming" | "ready" | "error";
  error?: Error;
  sendMessage: ReturnType<typeof vi.fn>;
  regenerate: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};
let chat: Chat;
vi.mock("@ai-sdk/react", () => ({ useChat: () => chat }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

const tree = { owner: "o", repo: "r", defaultBranch: "main", totalFiles: 2, files: ["a.ts", "b.ts"], truncated: false };
const steps = [
  { path: "a.ts", reason: "Start here." },
  { path: "b.ts", reason: "Then this." },
];
const assistant = (...parts: object[]) => [
  { id: "u", role: "user", parts: [] },
  { id: "a", role: "assistant", parts },
];
const treeDone = { type: "tool-getRepoTree", state: "output-available", input: { owner: "o", repo: "r" }, output: tree };

beforeEach(() => {
  chat = {
    messages: [],
    status: "submitted",
    sendMessage: vi.fn(() => Promise.resolve()),
    regenerate: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
  };
  // CodePanel fetches the selected file; keep it loading so no network is touched.
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const status = () =>
  screen.getByRole("region", { name: "Tour plan" }).querySelector('p[aria-live="polite"]')!;

describe("TourPlanner", () => {
  it("sends one request on mount and shows the preparing state with a polite status", async () => {
    const { container } = render(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe("Preparing request…");
    await waitFor(() => expect(chat.sendMessage).toHaveBeenCalledTimes(1));
    expect(chat.sendMessage).toHaveBeenCalledWith({ text: "Plan a tour of o/r" });
    await expectNoAxeViolations(container);
  });

  it("Stop is keyboard-reachable while streaming; stopping shows a retry that takes focus", async () => {
    const user = userEvent.setup();
    chat.status = "streaming";
    chat.messages = assistant({ type: "tool-getRepoTree", state: "input-available", input: { owner: "o", repo: "r" } });
    const { container } = render(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe("Fetching file tree for o/r");
    await expectNoAxeViolations(container);

    await user.tab();
    const stop = screen.getByRole("button", { name: "Stop generating" });
    expect(document.activeElement).toBe(stop);
    await user.keyboard("{Enter}");

    expect(chat.stop).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Stop generating" })).toBeNull();
    expect(status().textContent).toBe("Error: You stopped generating the tour.");
    const retry = screen.getByRole("button", { name: "Retry generating the tour" });
    expect(document.activeElement).toBe(retry);
    await expectNoAxeViolations(container);

    await user.click(retry);
    expect(chat.regenerate).toHaveBeenCalledWith({ body: { sabotage: null } });
  });

  it("streams draft steps under the loaded tree, then shows the final tour", async () => {
    chat.status = "streaming";
    chat.messages = assistant(treeDone, { type: "tool-planTour", state: "input-streaming", input: { steps: [steps[0]] } });
    const { container, rerender } = render(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe("Loaded 2 files. Choosing where to start…");
    expect(screen.getByText("1. a.ts")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop generating" })).toBeTruthy();
    await expectNoAxeViolations(container);

    chat.status = "ready";
    chat.messages = assistant(treeDone, { type: "tool-planTour", state: "output-available", input: { steps }, output: { steps } });
    rerender(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe("Loaded 2 files. Tour ready: 2 steps.");
    expect(screen.queryByRole("button", { name: "Stop generating" })).toBeNull();
    expect(screen.getByRole("button", { name: /1\. a\.ts/ }).getAttribute("aria-current")).toBe("step");
    expect(screen.getByRole("region", { name: "Code" })).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it("shows a tool error in the ErrorCard and retries only the failed request", async () => {
    const user = userEvent.setup();
    chat.status = "ready";
    chat.messages = assistant({
      type: "tool-getRepoTree",
      state: "output-error",
      input: { owner: "o", repo: "r" },
      errorText: "Error: Repository not found or private.",
    });
    const { container } = render(<TourPlanner owner="o" repo="r" />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getAllByText(/Repository not found or private\./).length).toBeGreaterThan(0);
    await expectNoAxeViolations(container);
    await user.click(screen.getByRole("button", { name: "Retry generating the tour" }));
    expect(chat.regenerate).toHaveBeenCalledTimes(1);
  });

  it("keeps the tree when planning fails and says retry starts over", () => {
    chat.status = "error";
    chat.error = new TypeError("network error");
    chat.messages = assistant(treeDone);
    render(<TourPlanner owner="o" repo="r" />);
    expect(screen.getByRole("region", { name: "Repository files" })).toBeTruthy();
    expect(screen.getByText(/This starts over/)).toBeTruthy();
  });

  it("shows our per-IP rate limit message as-is", () => {
    chat.status = "error";
    chat.error = new APICallError({
      message: `${TOO_MANY} Try again in 9 minutes.`,
      url: "/api/tour",
      requestBodyValues: {},
      statusCode: 429,
    });
    render(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe(`Error: ${TOO_MANY} Try again in 9 minutes.`);
  });

  it("flags a finish without a plan as an error", () => {
    chat.status = "ready";
    chat.messages = assistant(treeDone);
    render(<TourPlanner owner="o" repo="r" />);
    expect(status().textContent).toBe("Error: The AI finished without picking any files to tour.");
  });

  it("doesn't send while offline and shows the offline message", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    render(<TourPlanner owner="o" repo="r" />);
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(status().textContent).toBe(`Error: ${OFFLINE}`);
    expect(chat.sendMessage).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
