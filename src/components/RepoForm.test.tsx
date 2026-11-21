// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import RepoForm from "./RepoForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockClear());
afterEach(cleanup);

const field = () => screen.getByRole("textbox", { name: "GitHub repository URL" });
const submit = () => screen.getByRole("button", { name: "Generate tour" });

describe("RepoForm", () => {
  const errors: [string, string][] = [
    ["", "Paste a GitHub repository URL."],
    ["https://gitlab.com/a/b", "Only GitHub repositories are supported."],
    ["github.com/vercel", "That URL is missing the repository name."],
    ["-bad/repo", "That doesn't look like a valid owner/repo."],
  ];

  it.each(errors)("%j shows %j, links it to the field and refocuses it", async (input, message) => {
    const user = userEvent.setup();
    const { container } = render(<RepoForm />);
    if (input) await user.type(field(), input);
    await user.click(submit());

    expect(screen.getByText(message)).toHaveProperty("id", "repo-error");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(field().getAttribute("aria-describedby")).toBe("repo-error");
    expect(document.activeElement).toBe(field());
    expect(submit()).toHaveProperty("disabled", false);
    expect(push).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });

  it("keeps the live region mounted and clears the error once the input is fixed", async () => {
    const user = userEvent.setup();
    render(<RepoForm />);
    const live = document.getElementById("repo-error")!;
    expect(live.getAttribute("aria-live")).toBe("polite");
    await user.click(submit());
    await user.type(field(), "vercel/next.js");
    expect(live.textContent).toBe("");
    expect(field().getAttribute("aria-invalid")).toBeNull();
  });

  it("navigates to the tour on valid input", async () => {
    const user = userEvent.setup();
    const { container } = render(<RepoForm />);
    await user.type(field(), "https://github.com/vercel/next.js{Enter}");
    expect(push).toHaveBeenCalledWith("/tour/vercel/next.js");
    await expectNoAxeViolations(container);
  });

  it("example buttons submit through the same validation", async () => {
    const user = userEvent.setup();
    render(<RepoForm />);
    await user.click(screen.getByRole("button", { name: "sindresorhus/is" }));
    expect(push).toHaveBeenCalledWith("/tour/sindresorhus/is");
  });
});
