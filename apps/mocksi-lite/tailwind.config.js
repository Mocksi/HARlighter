/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "selector",
	content: ["**/*.html", "**/*.tsx"],
	theme: {
		extend: {
			colors: {
				grey: "#819590",
				green: "#006C52",
				crimson: "#B8293D",
				orange: "#E56F0C",
			},
		},
	},
	plugins: [require("daisyui")],
};
