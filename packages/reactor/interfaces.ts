export interface Modification {
	selector?: string;
	action:
		| "replace"
		| "append"
		| "prepend"
		| "remove"
		| "swapImage"
		| "highlight"
		| "toast"
		| "addComponent"
        | "unknown";
	content?: string;
	imageUrl?: string;
	toastMessage?: string;
	componentHtml?: string;
	highlightStyle?: string;
}

export interface ModificationRequest {
	description: string;
	modifications: Modification[];
}
