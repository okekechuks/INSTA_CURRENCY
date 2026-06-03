import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyManifest(): Plugin {
  return {
    name: "copy-extension-manifest",
    closeBundle() {
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(__dirname, "dist/manifest.json"),
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
        popup: resolve(__dirname, "src/popup/popup.html"),
        background: resolve(__dirname, "src/background/background.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});

