// biome-ignore lint/style/useNodejsImportProtocol: Required for Node.js path and filesystem operations
const fs = require("fs");
// biome-ignore lint/style/useNodejsImportProtocol: Required for Node.js path operations
const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
	const isProd = argv.mode === "production";
	return {
		mode: isProd ? "production" : "development",
		entry: {
			background: path.resolve(__dirname, "background.ts"),
			content: path.resolve(__dirname, "content/content.tsx"),
		},
		output: {
			filename: "[name].js",
			path: path.resolve(__dirname, "dist/chrome"),
			publicPath: "/dist/chrome/",
			libraryTarget: "module", // Ensure output is treated as ES modules
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js"],
			alias: {
				"@components": path.resolve(__dirname, "common/"),
			},
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules|webpack\.config\.js|tailwind\.config\.js/,
				},
				{
					test: /\.css$/,
					use: ["style-loader", "css-loader", "postcss-loader"],
				},
				{
					test: /\.(png|jpe?g|gif|svg)$/i,
					use: [
						{
							loader: "file-loader",
							options: {
								name: "[path][name].[ext]",
							},
						},
					],
				},
			],
		},
		experiments: {
			outputModule: true, // Enable output as ES modules
		},
		target: "web",
		optimization: {
			minimize: isProd,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						output: {
							ascii_only: true,
						},
					},
				}),
			],
		},
		devtool: isProd ? false : "source-map",
	};
};