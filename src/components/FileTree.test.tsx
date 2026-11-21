// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/axe";
import FileTree from "./FileTree";

afterEach(cleanup);

const files = ["README.md", "src/index.ts", "src/lib/util.ts"];
const props = { files, totalFiles: 3, defaultBranch: "main", truncated: false };

describe("FileTree", () => {
  it("expands and collapses folders from the keyboard, updating aria-expanded", async () => {
    const user = userEvent.setup();
    const { container } = render(<FileTree {...props} />);
    const src = screen.getByRole("button", { name: /^src\// });
    expect(src.getAttribute("aria-expanded")).toBe("true");

    const lib = screen.getByRole("button", { name: /^lib\// });
    expect(lib.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "util.ts" })).toBeNull();

    lib.focus();
    await user.keyboard("{Enter}");
    expect(lib.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "util.ts" })).toBeTruthy();
    await expectNoAxeViolations(container);

    await user.keyboard(" ");
    expect(lib.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "util.ts" })).toBeNull();

    src.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("button", { name: "index.ts" })).toBeNull();
  });

  it("selects files and marks the current one", async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    render(<FileTree {...props} selected="README.md" onSelectFile={onSelectFile} />);
    expect(screen.getByRole("button", { name: "README.md" }).getAttribute("aria-current")).toBe("true");
    await user.click(screen.getByRole("button", { name: "index.ts" }));
    expect(onSelectFile).toHaveBeenCalledWith("src/index.ts");
  });

  it("shows the truncated badge only when capped", async () => {
    const { container, rerender } = render(<FileTree {...props} />);
    expect(screen.queryByText(/showing/)).toBeNull();
    rerender(<FileTree {...props} totalFiles={500} truncated />);
    expect(screen.getByText("showing 3 of 500")).toBeTruthy();
    expect(screen.getByText("500 files")).toBeTruthy();
    await expectNoAxeViolations(container);
  });
});
