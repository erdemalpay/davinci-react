import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import viteTsconfigPaths from "vite-tsconfig-paths";

// The commit being deployed on Vercel; a timestamp for local builds.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

// Publishes the build id as /version.json, so open panels can tell a new
// version was deployed (see src/hooks/useNewVersionReload.ts).
function versionFile(): Plugin {
  return {
    name: "version-file",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId: BUILD_ID }),
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    host: true,
  },
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react(), viteTsconfigPaths(), svgrPlugin(), versionFile()],
});
