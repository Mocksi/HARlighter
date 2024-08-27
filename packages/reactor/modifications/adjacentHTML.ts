import { AppliableModification } from "../interfaces";

export class AdjacentHTMLModification extends AppliableModification {
	elementId: string;
	position: InsertPosition;
	newValue: string;

	constructor(
		doc: Document,
		element: Element,
		position: InsertPosition,
		newValue: string,
	) {
		super(doc);
		
		this.position = position;
		this.newValue = newValue;
		
		this.elementId = this.addModifiedElement(element);
	}

	apply(): void {
		for (const element of this.getModifiedElements()) {
			const oldValue = element.outerHTML;
			this.setElementState(this.getMocksiId(element), oldValue);
			element.insertAdjacentHTML(this.position, this.newValue);
		}
	}

	unapply(): void {
		for (const element of this.getModifiedElements()) {
			const oldValue = this.getElementState(this.getMocksiId(element));
			if (oldValue) {
				element.outerHTML = oldValue;
			}
		}
	}
}
