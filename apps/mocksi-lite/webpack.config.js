// biome-ignore lint/style/useNodejsImportProtocol: Required for Node.js path and filesystem operations
const fs = require("fs");
// biome-ignore lint/style/useNodejsImportProtocol: Required for Node.js path operations
const path = require("path");
function scanFilesInFolder(dirPath, fileExtension) {
	if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
		return [];
	}
	const files = [];
	function recurse(currentPath) {
		const entries = fs.readdirSync(currentPath, { withFileTypes: true });
		for (const entry of entries) {
			const entryPath = path.join(currentPath, entry.name);
			if (entry.isDirectory()) {
				recurse(entryPath);
			} else if (entry.isFile() && entry.name.endsWith(fileExtension)) {
				files.push(entryPath);
			}
		}
	}
	recurse(currentPath);
	return files;
}
function generateEntries(includes, outputPath) {
	if (!includes || !includes.length) {
		return {};
	}
	return includes.reduce((acc, include) => {
		const extname = path.extname(include);
		const filename = path.basename(include, extname);
		return Object.assign(Object.assign({}, acc), {
			[`${outputPath}/${filename}`]: include,
		});
	}, {});
}
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
		},
		devtool: isProd ? false : "source-map",
	};
};
//# sourceMappingURL=webpack.config.js.map
