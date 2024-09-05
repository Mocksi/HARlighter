import { ManifestV3Export, crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import manifest from "./manifest.json";
import pkg from "./package.json";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

export default defineConfig(async ({ mode }) => {
  let isDev = process.env.__DEV__ === "true";
  // Keys are used to create stable extension ids for unpacked builds
  const QA_UNPACKED_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA07fIdpHz/cZNpPxNKlUpUDv0HDDfyWfLwVl1lq/YtXVLIjQ9CRGUH8C4CX+MMZSALTE0PZZu1Tclin/hno9cHDm3/Iv9Ijqij6WEs4BDQ5UKy8Q13gmoJr2+4rUPwxeCuI1HLyUSsBSL3GazdQw68/hf3l43uNfQpphb8fxQEhQyeQBi6YzQYf/W7xepENfh3Xlp4etfMS6Xl5OaAqrnUPQmTsJKEJbqs0o5l2EgoRHqvkJHhZ4zeUWZ/GgoqKxy8UahtmywVxDz73zmrBLP3thPaQbiNBRhpKOR/Ldto4P7tm6IdTQgI9CuOCKwZtG9G4j1yXhVX8MfKk17QY4gSwIDAQAB";
  const DEV_UNPACKED_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtdeTUTUuHZx1xSvDuISF7wJP8nEPwW4vP8zTkdfdtb/1wM0JJ7XFeUHSIiq8l4Cs6/2f8tpK6MspeD7WhwuFWFHA2GWKoLSP0keuuBAhUFKrfISlNwFaNLX5LRkLSZQnr0ujIznvEuRZaXydIYR1e9pdhYTIcp2ToHW4CI02FUBtJVUUVeKGDiKKlKUrxwGtt1ecGZwVrQ1t7dj3DLrKguw1bONtoczFT3cCs9oVYg4l8frzlyI6xfsX8ynd4F+xS6+gYQ3aJBj7phAWHGAxbVRxTAzpzXRkb9A3ne31Ysjy4uYF9x7fK6NvDj/cm+EEfGDb3VmyXvOa3zeerXtdmwIDAQAB";

  const modes = ["QA", "staging", "production", "development"];
  if (!mode || !modes.includes(mode)) {
    mode = "production";
  }

  console.log(`Build target: ${mode}`);
  // If mode is 'production' apply manifest as is, note, published prod extension
  // manifest should not include 'key'
  switch (mode) {
    // QA creates a production build that can be run locally
    case "QA":
      manifest.name = "[QA Production] Mocksi Lite";
      manifest.key = QA_UNPACKED_KEY;
      break;
    case "development":
      manifest.name = "[Development] Mocksi Lite";
      manifest.externally_connectable.matches = ["http://localhost:3030/*"];
      manifest.content_security_policy.extension_pages =
        "object-src 'none'; child-src http://localhost:3030; frame-src http://localhost:3030; script-src 'self'";
      manifest.key = DEV_UNPACKED_KEY;
      break;
    case "staging":
      manifest.name = "[Staging] Mocksi Lite";
      manifest.externally_connectable.matches = [
        "https://nest-auth-ts-merge.onrender.com/*",
      ];
      manifest.content_security_policy.extension_pages =
        "object-src 'none'; child-src https://nest-auth-ts-merge.onrender.com; frame-src https://nest-auth-ts-merge.onrender.com; script-src 'self'";
      manifest.key = DEV_UNPACKED_KEY;
      break;
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
