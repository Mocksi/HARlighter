import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";

const plugins = [
  nodeResolve(),
  commonjs(),
  typescript(),
  replace({
    "process.env.NODE_ENV": JSON.stringify("production"),
    preventAssignment: true,
  }),
];

const mainConfig = defineConfig({
  input: "src/main.tsx",
  output: {
    file: "dist/main.js",
    format: "iife",
  },
  plugins,
  external: ["chrome-types"],
});

const backgroundConfig = defineConfig({
  input: "src/background.ts",
  output: {
    file: "dist/background.js",
    format: "iife",
  },
  plugins,
  external: ["chrome-types"],
});

export default [mainConfig, backgroundConfig];
