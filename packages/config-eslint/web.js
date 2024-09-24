/** @type {import("eslint").Linter.Config} */
module.exports = {
  env: {
    browser: true,
    es6: true,
  },

  extends: ["./base.js"],
  extends: [
    "@repo/config-eslint/base.js",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  globals: {
    JSX: true,
    React: true,
  },
  globals: {
    chrome: "readonly",
  },
  ignorePatterns: ["nodemon.js", "dist/**"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "no-unused-vars": "off",
    "react/react-in-jsx-scope": "off",
  },
};
