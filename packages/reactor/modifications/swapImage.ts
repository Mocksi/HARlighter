import { AppliableModification } from "../interfaces";
const cssSelector = require("css-selector-generator");

export class SwapImageModification extends AppliableModification {
	elementSelector: string;
	imageUrl: string;
	previousUrl: string | null;

	constructor(doc: Document, element: Element, imageUrl: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.imageUrl = imageUrl;

		if (element instanceof HTMLImageElement) {
			this.previousUrl = element.getAttribute("src");
		} else {
			this.previousUrl = null;
		}
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLImageElement) {
			element.src = this.imageUrl;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (this.previousUrl && element && element instanceof HTMLImageElement) {
			element.setAttribute("src", this.previousUrl);
		}
	}
}
