import { ManifestV3Export, crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

import devManifest from "./manifest.dev.json";
import manifest from "./manifest.json";
import pkg from "./package.json";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

const isDev = process.env.__DEV__ === "true";

const extensionManifest = {
  ...manifest,
  ...(isDev ? devManifest : ({} as ManifestV3Export)),
  name: isDev ? `DEV: ${manifest.name}` : manifest.name,
  version: pkg.version,
};

export default defineConfig({
  build: {
    emptyOutDir: !isDev,
    outDir,
    sourcemap: isDev,
  },
  plugins: [
    react(),
    crx({
      contentScripts: {
        injectCss: true,
      },
      manifest: extensionManifest as ManifestV3Export,
    }),
  ],
  publicDir,
  resolve: {
    alias: {
      "@assets": assetsDir,
      "@pages": pagesDir,
      "@src": root,
    },
  },
});
