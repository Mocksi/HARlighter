import { AppliableModification } from "../interfaces";
const cssSelector = require("css-selector-generator");

export class ReplaceModification extends AppliableModification {
	elementSelector: string;
	oldValue: string;
	newValue: string;

	constructor(doc: Document, element: Element, newValue: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.newValue = newValue;
		this.oldValue = element.innerHTML;
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element) {
			element.innerHTML = this.newValue;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element) {
			element.innerHTML = this.oldValue;
		}
	}
}
