export interface TimeStampReference {
	// NOTE: this is a iso8601 date string
	recordedAt: string;
	// NOTE: this is a iso8601 date string
	currentTime: string;
}

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
		| "updateTimestampReferences"
		| "unknown";
	content?: string;
	imageUrl?: string;
	toastMessage?: string;
	componentHtml?: string;
	highlightStyle?: string;
	duration?: number;
	timestampRef?: TimeStampReference;
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
	highlightNodes: Node[] = [];

	constructor(doc: Document) {
		this.doc = doc;
	}

	abstract apply(): void;
	abstract unapply(): void;

	getHighlightNodes(): Node[] {
		return this.highlightNodes;
	}

	addHighlightNode(node: Node): void {
		this.highlightNodes.push(node);
	}
}
