const { resolve } = require("node:path");
const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "eslint-config-turbo",
    "eslint-config-prettier",
    "prettier",
  ],
  ignorePatterns: [
    // Ignore dotfiles
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["only-warn", "@typescript-eslint/eslint-plugin"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-unused-vars": "off",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
};
