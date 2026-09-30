import { defineConfig } from "vitest/config";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Vitest bundles Vite 5 while this application still uses Vite 4 and
  // @vitejs/plugin-react 3. Vite's esbuild transform handles the automatic
  // JSX runtime in tests without injecting an incompatible refresh preamble.
  plugins: [viteTsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    css: false,
  },
});
