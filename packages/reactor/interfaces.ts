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

export interface Highlighter {
	highlightNode(elementToHighlight: Node): void;
	removeHighlightNode(elementToUnhighlight: Node): void;
}

export abstract class AppliableModification {
	doc: Document;
	highlightNodeSelectors: string[] = [];

	constructor(doc: Document) {
		this.doc = doc;
	}

	abstract apply(): void;
	abstract unapply(): void;

	getHighlightNodeSelectors(): string[] {
		return this.highlightNodeSelectors;
	}

	addHighlightNodeSelector(selector: string): void {
		this.highlightNodeSelectors.push(selector);
	}
}
