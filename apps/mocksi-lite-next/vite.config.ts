import { type ManifestV3Export, crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import baseManifest from "./manifest.json";
import pkg from "./package.json";

interface ManifestConfig {
  content_security_policy: {
    extension_pages: string;
  };
  externally_connectable: {
    matches: string[];
  };
  key?: string;
  name: string;
  web_accessible_resources: { matches: string[]; resources: string[] }[];
}

const root = resolve(__dirname, "src");

const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const pagesDir = resolve(root, "pages");
const publicDir = resolve(__dirname, "public");

export default defineConfig(({ mode }) => {
  let isDev = process.env.__DEV__ === "true";
  // Keys are used to create stable extension ids for unpacked builds, only use for unpublished extension builds
  const PROD_UNPACKED_KEY =
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmVIBAakn1m+kbh9QHDHf7jdbPKkGtlqOMJLsFKUFf9t/IV23Z79ZmcEjDNPxOmRADQQLWQJ3zZ2eMrYhSJuoKX0X8RSj8EqHehk4z2daFmtW3nLm80wiphT72isex4XqOC2Dg9/5Vj9UB2+M4fdiRBi10LZmAT0pkCRT8rJiuUO+MRByPEU+ChfvKEIJQqRSp97hUQmeYfiLZHH/VZHLm/o71L1zKDzQIg6+CvyrAMtzt2XDsT3c4+NsqX/+LgpJmhvpwxNAjyLBl02633XzWEiiu6UifYU7wvA/HeRj5O30WtOd6cXRh1grfKTWJnJmumlzRWdHzLS/WWMm29ucdwIDAQAB";
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

  const manifest: ManifestConfig = baseManifest;

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
      });

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
