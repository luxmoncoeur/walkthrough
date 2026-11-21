import { describe, expect, it } from "vitest";
import { highlight, languageFor } from "./highlight";

describe("languageFor", () => {
  const rows: [string, string][] = [
    ["src/index.ts", "ts"],
    ["src/App.TSX", "tsx"],
    ["main.py", "py"],
    ["src/lib.rs", "rs"],
    [".github/workflows/ci.yml", "yml"],
    ["README.md", "md"],
    ["native/addon.cc", "cpp"],
    ["include/util.h", "c"],
    ["lib/app.ex", "elixir"],
    ["Dockerfile", "dockerfile"],
    ["tools/Makefile", "makefile"],
    ["LICENSE", "text"],
    ["notes.txt", "text"],
    ["data.unknownext", "text"],
  ];

  it.each(rows)("%j → %s", (path, expected) => {
    expect(languageFor(path)).toBe(expected);
  });
});

describe("highlight", () => {
  it("escapes HTML in the code (repo contents are untrusted)", async () => {
    const html = await highlight('<img src=x onerror="alert(1)">', "evil.html");
    expect(html).not.toContain("<img");
    expect(html).toContain("&#x3C;");
  });

  it("escapes HTML in unhighlighted (text) files too", async () => {
    const html = await highlight("<script>alert(1)</script>", "LICENSE");
    expect(html).not.toContain("<script");
    expect(html).toContain("&#x3C;script>");
  });

  it("adds colors for known languages", async () => {
    expect(await highlight("const a = 1;", "a.ts")).toMatch(/style="color:#/);
  });
});
