import { generateRandomString } from "./utils.js";

export type Modification = {
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
	uuid: string;
	highlightNodes: Node[] = [];
	elementState: { [key: string]: any } = {};

	constructor(doc: Document) {
		this.doc = doc;
		this.uuid = generateRandomString(8);
	}

	abstract apply(): void;
	abstract unapply(): void;

	addModifiedElement(element: Element): string {
		let mocksiId = element.getAttribute("mocksi-id");
		if (!mocksiId) {
			mocksiId = generateRandomString(8);
			element.setAttribute("mocksi-id", mocksiId);
		}

		element.setAttribute(`mocksi-modified-${this.uuid}`, "true");

		return mocksiId;
	}

	removeModifiedElement(element: Element): void {
		let mocksiId = element.getAttribute("mocksi-id");
		if (mocksiId) {
			this.removeElementState(mocksiId);
		}

		element.removeAttribute(`mocksi-modified-${this.uuid}`);
	}

	getModifiedElement(mocksiId: string): Element | null {
		return this.doc.querySelector(`[mocksi-id="${mocksiId}"]`);
	}

	getModifiedElements(): Element[] {
		return Array.from(
			this.doc.querySelectorAll(`[mocksi-modified-${this.uuid}]`),
		) as Element[];
	}

	// returns true if the modification is no longer needed because it no
	// longer applied to any nodes. In that case it will be removed from
	// the list of modifications
	modifiedElementRemoved(element: Element, mocksiId: string): boolean {
		this.removeElementState(mocksiId);
		return this.elementState.length === 0;
	}

	getMocksiId(element: Element): string {
		return element.getAttribute("mocksi-id") || "";
	}

	setElementState(mocksiId: string, state: any): void {
		this.elementState[mocksiId] = state;
	}

	getElementState(mocksiId: string): any {
		return this.elementState[mocksiId];
	}

	removeElementState(mocksiId: string): void {
		delete this.elementState[mocksiId];
	}

	getHighlightNodes(): Node[] {
		return this.highlightNodes;
	}

	addHighlightNode(node: Node): void {
		this.highlightNodes.push(node);
	}
}