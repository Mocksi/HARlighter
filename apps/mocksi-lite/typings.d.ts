declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}

declare module "*.png" {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const value: any;
	export default value;
}
export interface Alteration {
	selector: string;
	action: string;
	dom_before: string;
	dom_after: string;
}

export interface Recording {
	created_timestamp: Date;
	alterations: Alteration[];
	creator: string;
	customer_name: string;
	demo_name: string;
	dom_before: string;
	tab_id: string;
	uuid: string;
}
