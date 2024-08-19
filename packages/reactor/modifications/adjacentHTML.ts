import { AppliableModification } from "../interfaces";

export class AdjacentHTMLModification extends AppliableModification {
	element: Element;
	position: InsertPosition;
	oldValue: string;
	newValue: string;

	constructor(
		doc: Document,
		element: Element,
		position: InsertPosition,
		newValue: string,
	) {
		super(doc);
		this.element = element;
		this.position = position;
		this.newValue = newValue;
		this.oldValue = element.outerHTML;
	}

	apply(): void {
		this.element.insertAdjacentHTML(this.position, this.newValue);

		// TODO - highlighting
	}

	unapply(): void {
		this.element.outerHTML = this.oldValue;
	}
}
