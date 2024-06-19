import { MOCKSI_MODIFICATIONS } from "../consts";

export interface Command {
	execute(): void;
	undo(): void;
}

interface DOMModification {
	keyToSave: string;
	previousText: string;
	nextText: string;
}

export const buildQuerySelector = (
	parentElement: HTMLElement,
	newValue: string,
) => {
	const { localName, id, classList } = parentElement;
	let keyToSave = localName;
	if (id) {
		keyToSave += `#${id}`;
	}
	if (classList.length) {
		keyToSave += `.${[...classList].join(".")}`;
	}
	let elements: NodeListOf<Element>;
	try {
		elements = document.querySelectorAll(keyToSave);
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.error(`Error querying selector ${keyToSave}: ${e}`);
		}
		return keyToSave;
	}

	if (elements.length) {
		keyToSave += `[${[...elements].indexOf(parentElement)}]`;
	}
	keyToSave += `{${newValue}}`;
	return keyToSave;
};

export class SaveModificationCommand implements Command {

	constructor(
		private prevModifications: {[querySelector: string]: { nextText: string; previousText: string }},
		private modification: DOMModification,
	) {
	}

	execute() {
		const { keyToSave, nextText, previousText } = this.modification;
		const { previousText: previousTextFromStorage } =
			this.prevModifications[keyToSave] || {};
		this.prevModifications[keyToSave] = {
			nextText,
			previousText: previousTextFromStorage || previousText,
		}
	}

	undo() {
		const { keyToSave, previousText } = this.modification;
		this.prevModifications[keyToSave] = { previousText, nextText: '' }
	}
}

class LoadModificationCommand implements Command {
	execute(): void {
		throw new Error("Method not implemented.");
	}
	undo(): void {
		throw new Error("Method not implemented.");
	}
}
