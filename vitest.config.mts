import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Lib tests run on node (the default); component tests opt into jsdom with a
// `// @vitest-environment jsdom` comment at the top of the file.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**"],
      reporter: ["text", "text-summary"],
    },
  },
});
