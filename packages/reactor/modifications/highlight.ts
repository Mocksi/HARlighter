import { AppliableModification } from "../interfaces.js";
import * as cssSelector from "css-selector-generator";

export class HighlightModification extends AppliableModification {
	elementSelector: string;
	highlightStyle: string;
	prevBorder: string;

	constructor(doc: Document, element: Element, highlightStyle: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.highlightStyle = highlightStyle;
		this.prevBorder = "";

		if (element instanceof HTMLElement) {
			this.prevBorder = element.style.border;
		}
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLElement) {
			element.style.border = this.highlightStyle;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLElement) {
			element.style.border = this.prevBorder;
		}
	}
}
