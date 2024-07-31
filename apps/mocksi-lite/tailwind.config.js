/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: "mw-",
	darkMode: "selector",
	content: [
		"./content/**/*.{html,js,jsx,ts,tsx,css}",
		"./common/**/*.{html,js,jsx,ts,tsx,css}",
	],
	theme: {
		extend: {
			// Extend the utilities
			utilities: {
				".mcksi-frame-include": {
					"--mcksi-frame-include": "true",
				},
			},
			colors: {
				grey: "#819590",
				green: "#006C52",
				crimson: "#B8293D",
				orange: "#E56F0C",
			},
		},
	},
	corePlugins: {
		preflight: false,
	},
	plugins: [require("daisyui")],
};
