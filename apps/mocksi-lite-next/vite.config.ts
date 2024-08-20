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

// plugin to remove dev icons from prod build
function stripDevIcons(apply: boolean) {
  if (apply) return null;

  return {
    name: "strip-dev-icons",
    renderStart(outputOptions: any, inputOptions: any) {
      const outDir = outputOptions.dir;
      fs.rm(resolve(outDir, "dev-icon-32.png"), () =>
        console.log(`Deleted dev-icon-32.png frm prod build`),
      );
      fs.rm(resolve(outDir, "dev-icon-128.png"), () =>
        console.log(`Deleted dev-icon-128.png frm prod build`),
      );
    },
    resolveId(source: string) {
      return source === "virtual-module" ? source : null;
    },
  };
}

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
    stripDevIcons(isDev),
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
