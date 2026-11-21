// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import CodePanel from "./CodePanel";

const file = { owner: "vercel", repo: "ms", gitRef: "main" };
const ok = (body: object) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CodePanel", () => {
  it("shows a hint when no file is picked, without fetching", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<CodePanel {...file} />);
    expect(screen.getByText("Pick a step or a file to see its code.")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    await expectNoAxeViolations(container);
  });

  it("loads, then shows the highlighted file", async () => {
    let resolve!: (r: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolve = r))));
    const { container } = render(<CodePanel {...file} path="src/index.ts" />);
    expect(screen.getByText("Loading…")).toBeTruthy();
    await expectNoAxeViolations(container);

    resolve(ok({ html: '<pre tabindex="0"><code>export {}</code></pre>', truncated: true, empty: false }));
    expect(await screen.findByRole("region", { name: "Contents of src/index.ts" })).toBeTruthy();
    expect(screen.getByText("Large file: showing the first 200,000 characters.")).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it("shows the empty-file note", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ok({ html: "", truncated: false, empty: true })));
    render(<CodePanel {...file} path="empty.txt" />);
    expect(await screen.findByText("(empty file)")).toBeTruthy();
  });

  it("shows the server's error with a working retry", async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("File not found.", { status: 404 }))
      .mockResolvedValueOnce(ok({ html: "<pre>ok</pre>", truncated: false, empty: false }));
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<CodePanel {...file} path="gone.ts" />);

    expect((await screen.findByRole("alert")).textContent).toContain("File not found.");
    await expectNoAxeViolations(container);
    await user.click(screen.getByRole("button", { name: "Retry loading this file" }));
    expect(await screen.findByRole("region", { name: "Contents of gone.ts" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("shows a connection message when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    render(<CodePanel {...file} path="a.ts" />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Couldn't load this file. Check your connection.",
    );
  });
});
