export interface Modification {
	selector?: string;
	xpath?: string;
	action:
		| "replace"
		| "replaceAll"
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
	duration?: number;
}

export interface ModificationRequest {
	description: string;
	modifications: Modification[];
}

export interface AppliedModifications {
	modificationRequest: ModificationRequest;

	/**
	 * Turn highlighting on or off for the changes made
	 * by this request
	 */
	setHighlight(highlight: boolean): void;
}

export interface DomJsonExportNode {
	tag: string;
	visible: boolean;
	text?: string;
	attributes?: Record<string, string>;
	children?: DomJsonExportNode[];
}
