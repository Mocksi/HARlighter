import { AppliableModification } from "../interfaces.js";
import * as cssSelector from "css-selector-generator";

export class RemoveModification extends AppliableModification {
	element: Element;
	parentSelector: string | null;
	nextSiblingSelector: string | null = null;

	constructor(doc: Document, element: Element) {
		super(doc);
		this.element = element;
		this.parentSelector = element.parentElement
			? cssSelector.getCssSelector(element.parentElement)
			: null;
	}

	apply(): void {
		// get the element's next sibling
		const nextSibling = this.element.nextElementSibling;
		this.element.remove();
		// now get the selector for the sibling after the element was
		// removed
		this.nextSiblingSelector = nextSibling
			? cssSelector.getCssSelector(nextSibling)
			: null;
	}

	unapply(): void {
		let parent: Element | null = null;
		if (this.parentSelector) {
			parent = this.doc.querySelector(this.parentSelector);
		}
		if (!parent) {
			return;
		}

		let nextSibling: Element | null = null;
		if (this.nextSiblingSelector) {
			nextSibling = this.doc.querySelector(this.nextSiblingSelector);
		}

		if (nextSibling) {
			parent.insertBefore(this.element, nextSibling);
		} else {
			parent.appendChild(this.element);
		}
	}
}
