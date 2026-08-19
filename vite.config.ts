import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

function copyExtensionFiles(): Plugin {
  return {
    name: "copy-extension-files",
    closeBundle() {
      const distRoot = resolve(projectRoot, "dist");
      const assetSource = resolve(projectRoot, "src/popup/assets");
      const assetTarget = resolve(distRoot, "assets");
      mkdirSync(assetTarget, { recursive: true });

      for (const file of readdirSync(assetSource)) {
        copyFileSync(resolve(assetSource, file), resolve(assetTarget, file));
      }

      copyFileSync(resolve(projectRoot, "manifest.json"), resolve(distRoot, "manifest.json"));
    },
  };
}

export default defineConfig({
  plugins: [copyExtensionFiles()],
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
