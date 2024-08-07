export type AlterationType = "text" | "image";

export type Alteration = {
	selector: string;
	dom_after: string;
	dom_before: string;
	type: AlterationType;
};
