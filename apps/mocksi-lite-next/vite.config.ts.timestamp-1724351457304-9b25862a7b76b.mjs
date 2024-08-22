// vite.config.ts
import { crx } from "file:///Users/kayla/Code/Mocksi/HARlighter/node_modules/.pnpm/@crxjs+vite-plugin@2.0.0-beta.25/node_modules/@crxjs/vite-plugin/dist/index.mjs";
import react from "file:///Users/kayla/Code/Mocksi/HARlighter/node_modules/.pnpm/@vitejs+plugin-react@4.3.1_vite@5.3.3_@types+node@20.14.10_less@4.2.0_sass@1.77.8_terser@5.31.2_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
import { defineConfig } from "file:///Users/kayla/Code/Mocksi/HARlighter/node_modules/.pnpm/vite@5.3.3_@types+node@20.14.10_less@4.2.0_sass@1.77.8_terser@5.31.2/node_modules/vite/dist/node/index.js";

// manifest.dev.json
var manifest_dev_default = {
  chrome_url_overrides: {
    newtab: "src/pages/newtab/index.html"
  },
  content_security_policy: {
    extension_pages: "object-src 'none'; child-src http://localhost:3030; frame-src http://localhost:3030; script-src 'self'"
  },
  devtools_page: "src/pages/devtools/index.html",
  externally_connectable: {
    matches: ["http://localhost:3030/*"]
  },
  name: "Mocksi Lite: Next (DEV)",
  options_ui: {
    page: "src/pages/options/index.html"
  }
};

// manifest.json
var manifest_default = {
  action: {
    default_icon: {
      "32": "mocksi-icon.png"
    }
  },
  background: {
    service_worker: "src/pages/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      js: ["src/pages/content/mocksi-extension.tsx"],
      matches: ["http://*/*", "https://*/*", "<all_urls>"]
    }
  ],
  content_security_policy: {
    extension_pages: "object-src 'none'; child-src http://nest-auth-ts-merge.onrender.com; frame-src http://nest-auth-ts-merge.onrender.com; script-src 'self'"
  },
  description: "https://www.mocksi.ai",
  externally_connectable: {
    matches: ["http://nest-auth-ts-merge.onrender.com/*"]
  },
  icons: {
    "128": "mocksi-logo.png"
  },
  manifest_version: 3,
  name: "Mocksi Lite: Next",
  permissions: [
    "activeTab",
    "background",
    "cookies",
    "downloads",
    "debugger",
    "scripting",
    "storage",
    "tabs",
    "webNavigation",
    "webRequest"
  ],
  web_accessible_resources: [
    {
      matches: [],
      resources: ["mocksi-icon.png", "mocksi-logo.png"]
    }
  ]
};

// package.json
var package_default = {
  dependencies: {
    "@repo/reactor": "workspace:*",
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    uuid: "^9.0.1",
    "webextension-polyfill": "^0.11.0"
  },
  dependenciesMeta: {
    "@repo/reactor": {
      injected: true
    }
  },
  description: "A simple chrome extension template with Vite, React, TypeScript and Tailwind CSS.",
  devDependencies: {
    "@crxjs/vite-plugin": "^2.0.0-beta.23",
    "@types/chrome": "^0.0.268",
    "@types/node": "^20.12.11",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/webextension-polyfill": "^0.10.7",
    "@typescript-eslint/eslint-plugin": "^7.8.0",
    "@typescript-eslint/parser": "^7.8.0",
    "@vitejs/plugin-react": "^4.2.1",
    autoprefixer: "^10.4.19",
    eslint: "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^4.6.2",
    "fs-extra": "^11.2.0",
    nodemon: "^3.1.0",
    postcss: "^8.4.38",
    prettier: "^3.2.5",
    tailwindcss: "^3.4.3",
    "ts-node": "^10.9.2",
    typescript: "^5.4.5",
    vite: "^5.2.11"
  },
  license: "MIT",
  name: "vite-web-extension",
  repository: {
    type: "git",
    url: "https://github.com/JohnBra/web-extension.git"
  },
  scripts: {
    build: "vite build",
    dev: "nodemon",
    format: 'prettier --write "src/**/*.{tsx,ts}"',
    lint: "eslint --fix --ext .ts,.tsx"
  },
  type: "module",
  version: "1.2.0"
};

// vite.config.ts
var __vite_injected_original_dirname = "/Users/kayla/Code/Mocksi/HARlighter/apps/mocksi-lite-next";
var root = resolve(__vite_injected_original_dirname, "src");
var pagesDir = resolve(root, "pages");
var assetsDir = resolve(root, "assets");
var outDir = resolve(__vite_injected_original_dirname, "dist");
var publicDir = resolve(__vite_injected_original_dirname, "public");
var isDev = process.env.__DEV__ === "true";
var extensionManifest = {
  ...manifest_default,
  ...isDev ? manifest_dev_default : {},
  name: isDev ? `DEV: ${manifest_default.name}` : manifest_default.name,
  version: package_default.version
};
var vite_config_default = defineConfig({
  build: {
    emptyOutDir: !isDev,
    outDir,
    sourcemap: isDev
  },
  plugins: [
    react(),
    crx({
      contentScripts: {
        injectCss: true
      },
      manifest: extensionManifest
    })
  ],
  publicDir,
  resolve: {
    alias: {
      "@assets": assetsDir,
      "@pages": pagesDir,
      "@src": root
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuZGV2Lmpzb24iLCAibWFuaWZlc3QuanNvbiIsICJwYWNrYWdlLmpzb24iXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMva2F5bGEvQ29kZS9Nb2Nrc2kvSEFSbGlnaHRlci9hcHBzL21vY2tzaS1saXRlLW5leHRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9rYXlsYS9Db2RlL01vY2tzaS9IQVJsaWdodGVyL2FwcHMvbW9ja3NpLWxpdGUtbmV4dC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMva2F5bGEvQ29kZS9Nb2Nrc2kvSEFSbGlnaHRlci9hcHBzL21vY2tzaS1saXRlLW5leHQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBNYW5pZmVzdFYzRXhwb3J0LCBjcnggfSBmcm9tIFwiQGNyeGpzL3ZpdGUtcGx1Z2luXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5cbmltcG9ydCBkZXZNYW5pZmVzdCBmcm9tIFwiLi9tYW5pZmVzdC5kZXYuanNvblwiO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gXCIuL21hbmlmZXN0Lmpzb25cIjtcbmltcG9ydCBwa2cgZnJvbSBcIi4vcGFja2FnZS5qc29uXCI7XG5cbmNvbnN0IHJvb3QgPSByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIik7XG5jb25zdCBwYWdlc0RpciA9IHJlc29sdmUocm9vdCwgXCJwYWdlc1wiKTtcbmNvbnN0IGFzc2V0c0RpciA9IHJlc29sdmUocm9vdCwgXCJhc3NldHNcIik7XG5jb25zdCBvdXREaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0XCIpO1xuY29uc3QgcHVibGljRGlyID0gcmVzb2x2ZShfX2Rpcm5hbWUsIFwicHVibGljXCIpO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Ll9fREVWX18gPT09IFwidHJ1ZVwiO1xuXG5jb25zdCBleHRlbnNpb25NYW5pZmVzdCA9IHtcbiAgLi4ubWFuaWZlc3QsXG4gIC4uLihpc0RldiA/IGRldk1hbmlmZXN0IDogKHt9IGFzIE1hbmlmZXN0VjNFeHBvcnQpKSxcbiAgbmFtZTogaXNEZXYgPyBgREVWOiAke21hbmlmZXN0Lm5hbWV9YCA6IG1hbmlmZXN0Lm5hbWUsXG4gIHZlcnNpb246IHBrZy52ZXJzaW9uLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBlbXB0eU91dERpcjogIWlzRGV2LFxuICAgIG91dERpcixcbiAgICBzb3VyY2VtYXA6IGlzRGV2LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBjcngoe1xuICAgICAgY29udGVudFNjcmlwdHM6IHtcbiAgICAgICAgaW5qZWN0Q3NzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIG1hbmlmZXN0OiBleHRlbnNpb25NYW5pZmVzdCBhcyBNYW5pZmVzdFYzRXhwb3J0LFxuICAgIH0pLFxuICBdLFxuICBwdWJsaWNEaXIsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAYXNzZXRzXCI6IGFzc2V0c0RpcixcbiAgICAgIFwiQHBhZ2VzXCI6IHBhZ2VzRGlyLFxuICAgICAgXCJAc3JjXCI6IHJvb3QsXG4gICAgfSxcbiAgfSxcbn0pO1xuIiwgIntcbiAgXCJjaHJvbWVfdXJsX292ZXJyaWRlc1wiOiB7XG4gICAgXCJuZXd0YWJcIjogXCJzcmMvcGFnZXMvbmV3dGFiL2luZGV4Lmh0bWxcIlxuICB9LFxuICBcImNvbnRlbnRfc2VjdXJpdHlfcG9saWN5XCI6IHtcbiAgICBcImV4dGVuc2lvbl9wYWdlc1wiOiBcIm9iamVjdC1zcmMgJ25vbmUnOyBjaGlsZC1zcmMgaHR0cDovL2xvY2FsaG9zdDozMDMwOyBmcmFtZS1zcmMgaHR0cDovL2xvY2FsaG9zdDozMDMwOyBzY3JpcHQtc3JjICdzZWxmJ1wiXG4gIH0sXG4gIFwiZGV2dG9vbHNfcGFnZVwiOiBcInNyYy9wYWdlcy9kZXZ0b29scy9pbmRleC5odG1sXCIsXG4gIFwiZXh0ZXJuYWxseV9jb25uZWN0YWJsZVwiOiB7XG4gICAgXCJtYXRjaGVzXCI6IFtcImh0dHA6Ly9sb2NhbGhvc3Q6MzAzMC8qXCJdXG4gIH0sXG4gIFwibmFtZVwiOiBcIk1vY2tzaSBMaXRlOiBOZXh0IChERVYpXCIsXG4gIFwib3B0aW9uc191aVwiOiB7XG4gICAgXCJwYWdlXCI6IFwic3JjL3BhZ2VzL29wdGlvbnMvaW5kZXguaHRtbFwiXG4gIH1cbn1cbiIsICJ7XG4gIFwiYWN0aW9uXCI6IHtcbiAgICBcImRlZmF1bHRfaWNvblwiOiB7XG4gICAgICBcIjMyXCI6IFwibW9ja3NpLWljb24ucG5nXCJcbiAgICB9XG4gIH0sXG4gIFwiYmFja2dyb3VuZFwiOiB7XG4gICAgXCJzZXJ2aWNlX3dvcmtlclwiOiBcInNyYy9wYWdlcy9iYWNrZ3JvdW5kL2luZGV4LnRzXCIsXG4gICAgXCJ0eXBlXCI6IFwibW9kdWxlXCJcbiAgfSxcbiAgXCJjb250ZW50X3NjcmlwdHNcIjogW1xuICAgIHtcbiAgICAgIFwianNcIjogW1wic3JjL3BhZ2VzL2NvbnRlbnQvbW9ja3NpLWV4dGVuc2lvbi50c3hcIl0sXG4gICAgICBcIm1hdGNoZXNcIjogW1wiaHR0cDovLyovKlwiLCBcImh0dHBzOi8vKi8qXCIsIFwiPGFsbF91cmxzPlwiXVxuICAgIH1cbiAgXSxcbiAgXCJjb250ZW50X3NlY3VyaXR5X3BvbGljeVwiOiB7XG4gICAgXCJleHRlbnNpb25fcGFnZXNcIjogXCJvYmplY3Qtc3JjICdub25lJzsgY2hpbGQtc3JjIGh0dHA6Ly9uZXN0LWF1dGgtdHMtbWVyZ2Uub25yZW5kZXIuY29tOyBmcmFtZS1zcmMgaHR0cDovL25lc3QtYXV0aC10cy1tZXJnZS5vbnJlbmRlci5jb207IHNjcmlwdC1zcmMgJ3NlbGYnXCJcbiAgfSxcbiAgXCJkZXNjcmlwdGlvblwiOiBcImh0dHBzOi8vd3d3Lm1vY2tzaS5haVwiLFxuICBcImV4dGVybmFsbHlfY29ubmVjdGFibGVcIjoge1xuICAgIFwibWF0Y2hlc1wiOiBbXCJodHRwOi8vbmVzdC1hdXRoLXRzLW1lcmdlLm9ucmVuZGVyLmNvbS8qXCJdXG4gIH0sXG4gIFwiaWNvbnNcIjoge1xuICAgIFwiMTI4XCI6IFwibW9ja3NpLWxvZ28ucG5nXCJcbiAgfSxcbiAgXCJtYW5pZmVzdF92ZXJzaW9uXCI6IDMsXG4gIFwibmFtZVwiOiBcIk1vY2tzaSBMaXRlOiBOZXh0XCIsXG4gIFwicGVybWlzc2lvbnNcIjogW1xuICAgIFwiYWN0aXZlVGFiXCIsXG4gICAgXCJiYWNrZ3JvdW5kXCIsXG4gICAgXCJjb29raWVzXCIsXG4gICAgXCJkb3dubG9hZHNcIixcbiAgICBcImRlYnVnZ2VyXCIsXG4gICAgXCJzY3JpcHRpbmdcIixcbiAgICBcInN0b3JhZ2VcIixcbiAgICBcInRhYnNcIixcbiAgICBcIndlYk5hdmlnYXRpb25cIixcbiAgICBcIndlYlJlcXVlc3RcIlxuICBdLFxuICBcIndlYl9hY2Nlc3NpYmxlX3Jlc291cmNlc1wiOiBbXG4gICAge1xuICAgICAgXCJtYXRjaGVzXCI6IFtdLFxuICAgICAgXCJyZXNvdXJjZXNcIjogW1wibW9ja3NpLWljb24ucG5nXCIsIFwibW9ja3NpLWxvZ28ucG5nXCJdXG4gICAgfVxuICBdXG59XG4iLCAie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAcmVwby9yZWFjdG9yXCI6IFwid29ya3NwYWNlOipcIixcbiAgICBcInJlYWN0XCI6IFwiXjE4LjMuMVwiLFxuICAgIFwicmVhY3QtZG9tXCI6IFwiXjE4LjMuMVwiLFxuICAgIFwidXVpZFwiOiBcIl45LjAuMVwiLFxuICAgIFwid2ViZXh0ZW5zaW9uLXBvbHlmaWxsXCI6IFwiXjAuMTEuMFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzTWV0YVwiOiB7XG4gICAgXCJAcmVwby9yZWFjdG9yXCI6IHtcbiAgICAgIFwiaW5qZWN0ZWRcIjogdHJ1ZVxuICAgIH1cbiAgfSxcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc2ltcGxlIGNocm9tZSBleHRlbnNpb24gdGVtcGxhdGUgd2l0aCBWaXRlLCBSZWFjdCwgVHlwZVNjcmlwdCBhbmQgVGFpbHdpbmQgQ1NTLlwiLFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAY3J4anMvdml0ZS1wbHVnaW5cIjogXCJeMi4wLjAtYmV0YS4yM1wiLFxuICAgIFwiQHR5cGVzL2Nocm9tZVwiOiBcIl4wLjAuMjY4XCIsXG4gICAgXCJAdHlwZXMvbm9kZVwiOiBcIl4yMC4xMi4xMVwiLFxuICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjMuMVwiLFxuICAgIFwiQHR5cGVzL3JlYWN0LWRvbVwiOiBcIl4xOC4zLjBcIixcbiAgICBcIkB0eXBlcy93ZWJleHRlbnNpb24tcG9seWZpbGxcIjogXCJeMC4xMC43XCIsXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvZXNsaW50LXBsdWdpblwiOiBcIl43LjguMFwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIl43LjguMFwiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjogXCJeNC4yLjFcIixcbiAgICBcImF1dG9wcmVmaXhlclwiOiBcIl4xMC40LjE5XCIsXG4gICAgXCJlc2xpbnRcIjogXCJeOC41Ny4wXCIsXG4gICAgXCJlc2xpbnQtY29uZmlnLXByZXR0aWVyXCI6IFwiXjkuMS4wXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLWltcG9ydFwiOiBcIl4yLjI5LjFcIixcbiAgICBcImVzbGludC1wbHVnaW4tanN4LWExMXlcIjogXCJeNi44LjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tcmVhY3RcIjogXCJeNy4zNC4xXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0LWhvb2tzXCI6IFwiXjQuNi4yXCIsXG4gICAgXCJmcy1leHRyYVwiOiBcIl4xMS4yLjBcIixcbiAgICBcIm5vZGVtb25cIjogXCJeMy4xLjBcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjM4XCIsXG4gICAgXCJwcmV0dGllclwiOiBcIl4zLjIuNVwiLFxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeMy40LjNcIixcbiAgICBcInRzLW5vZGVcIjogXCJeMTAuOS4yXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNC41XCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuMi4xMVwiXG4gIH0sXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcIm5hbWVcIjogXCJ2aXRlLXdlYi1leHRlbnNpb25cIixcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9Kb2huQnJhL3dlYi1leHRlbnNpb24uZ2l0XCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImJ1aWxkXCI6IFwidml0ZSBidWlsZFwiLFxuICAgIFwiZGV2XCI6IFwibm9kZW1vblwiLFxuICAgIFwiZm9ybWF0XCI6IFwicHJldHRpZXIgLS13cml0ZSBcXFwic3JjLyoqLyoue3RzeCx0c31cXFwiXCIsXG4gICAgXCJsaW50XCI6IFwiZXNsaW50IC0tZml4IC0tZXh0IC50cywudHN4XCJcbiAgfSxcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwidmVyc2lvblwiOiBcIjEuMi4wXCJcbn0iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZWLFNBQTJCLFdBQVc7QUFDblksT0FBTyxXQUFXO0FBRWxCLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjs7O0FDSjdCO0FBQUEsRUFDRSxzQkFBd0I7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
