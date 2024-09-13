import { ManifestV3Export, crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import manifest from "./manifest.json";
import pkg from "./package.json";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

export default defineConfig(({ mode }) => {
  let isDev = process.env.__DEV__ === "true";
  // Keys are used to create stable extension ids for unpacked builds, only use for unpublished extension builds
  const PROD_UNPACKED_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA07fIdpHz/cZNpPxNKlUpUDv0HDDfyWfLwVl1lq/YtXVLIjQ9CRGUH8C4CX+MMZSALTE0PZZu1Tclin/hno9cHDm3/Iv9Ijqij6WEs4BDQ5UKy8Q13gmoJr2+4rUPwxeCuI1HLyUSsBSL3GazdQw68/hf3l43uNfQpphb8fxQEhQyeQBi6YzQYf/W7xepENfh3Xlp4etfMS6Xl5OaAqrnUPQmTsJKEJbqs0o5l2EgoRHqvkJHhZ4zeUWZ/GgoqKxy8UahtmywVxDz73zmrBLP3thPaQbiNBRhpKOR/Ldto4P7tm6IdTQgI9CuOCKwZtG9G4j1yXhVX8MfKk17QY4gSwIDAQAB";
  const DEV_UNPACKED_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtdeTUTUuHZx1xSvDuISF7wJP8nEPwW4vP8zTkdfdtb/1wM0JJ7XFeUHSIiq8l4Cs6/2f8tpK6MspeD7WhwuFWFHA2GWKoLSP0keuuBAhUFKrfISlNwFaNLX5LRkLSZQnr0ujIznvEuRZaXydIYR1e9pdhYTIcp2ToHW4CI02FUBtJVUUVeKGDiKKlKUrxwGtt1ecGZwVrQ1t7dj3DLrKguw1bONtoczFT3cCs9oVYg4l8frzlyI6xfsX8ynd4F+xS6+gYQ3aJBj7phAWHGAxbVRxTAzpzXRkb9A3ne31Ysjy4uYF9x7fK6NvDj/cm+EEfGDb3VmyXvOa3zeerXtdmwIDAQAB";

  const modes = ["QA", "staging", "production", "development"];
  if (!mode || !modes.includes(mode)) {
    mode = "production";
  }

  const envMode = mode === "QA" ? "production" : mode;
  const envFileName = envMode === "production" ? ".env" : `.env.${envMode}`;

  const env = loadEnv(envMode, process.cwd());

  if (!env.VITE_NEST_APP || !env.VITE_NEST_APP.includes("http")) {
    throw new Error(
      `VITE_NEST_APP is not set correctly, please check .env files: ${env.VITE_NEST_APP}`,
    );
  }

  // Dev note: make sure these urls are what you expect them to be for current mode!
  manifest.externally_connectable.matches = [`${env.VITE_NEST_APP}/*`];
  manifest.content_security_policy.extension_pages = `object-src 'none'; child-src ${env.VITE_NEST_APP}; frame-src ${env.VITE_NEST_APP}; script-src 'self'`;

  // If mode is 'production' apply manifest as is, note, published prod extension
  // manifest should not include 'key'
  switch (mode) {
    // QA creates a production build that can be run locally
    case "QA":
      manifest.name = "[QA Production] Mocksi Lite";
      manifest.key = PROD_UNPACKED_KEY;
      break;
    case "development":
      manifest.name = "[Development] Mocksi Lite";
      manifest.key = DEV_UNPACKED_KEY;

      // add permissions to view source map
      manifest.web_accessible_resources.push({
        matches: ["<all_urls>"],
        resources: ["assets/*.js.map"],
      })

      break;
    case "staging":
      manifest.name = "[Staging] Mocksi Lite";
      manifest.key = DEV_UNPACKED_KEY;
      break;
  }
  console.log("** BUILDING MOCKSI LITE EXTENSION **");
  console.log(`TARGET:   "${mode}"`);
  console.log(`ENV FILE: "${envFileName}"`);
  console.log(`NEST URL: "${env.VITE_NEST_APP}"`);
  console.log(`MANIFEST: "${manifest.name}"`);
  console.log(" ");

  if (mode === "production" && manifest.key) {
    throw new Error(
      'Production manifest should not have a "key", please remove',
    );
  }

  const extensionManifest = {
    ...manifest,
    name: manifest.name,
    version: pkg.version,
  };

  return {
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
  };
});
