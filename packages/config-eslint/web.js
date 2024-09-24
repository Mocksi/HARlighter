module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "./base.js",
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
    "react/react-in-jsx-scope": "off",
  },
};
