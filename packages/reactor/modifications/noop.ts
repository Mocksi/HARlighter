import { AppliableModification } from "../interfaces";

export class NoopModification extends AppliableModification {
	action: string;

	constructor(doc: Document, action: string) {
		super(doc);
		this.action = action;
	}

	apply(): void {
		console.warn(`Unknown action: ${this.action}`);
	}

	unapply(): void {}
}
