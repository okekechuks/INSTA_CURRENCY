import { copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function copyManifest(): Plugin {
  return {
    name: "copy-extension-manifest",
    closeBundle() {
      copyFileSync(
        resolve(projectRoot, "manifest.json"),
        resolve(projectRoot, "dist/manifest.json"),
      );
    },
  };
}

export default defineConfig({
  plugins: [copyManifest()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(projectRoot, "src/popup/popup.html"),
        background: resolve(projectRoot, "src/background/background.ts"),
        content: resolve(projectRoot, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
