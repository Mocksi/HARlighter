/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/config-eslint/web.js"],
  root: true,
  types: ["vitest/globals"],
};
