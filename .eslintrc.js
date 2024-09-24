// This configuration only applies to the package manager root.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/config-eslint/base.js"],
  ignorePatterns: ["apps/**", "packages/**"],
  root: true,
};
