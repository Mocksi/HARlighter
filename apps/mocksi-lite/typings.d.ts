declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}

declare module "*.png" {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const value: any;
	export default value;
}

// workaround with NodeJS not found when building prod mode
declare namespace NodeJS {
	// biome-ignore lint/suspicious/noEmptyInterface: Just a workaround with production build not working when typing NodeJS objects
	export interface Timeout {}
}
