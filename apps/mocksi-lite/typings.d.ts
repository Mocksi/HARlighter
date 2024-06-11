declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}

declare module "*.png" {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const value: any;
	export default value;
}
