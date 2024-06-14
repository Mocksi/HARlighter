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

export const buildQuerySelector = (parentElement: HTMLElement) => {
	const { localName, id, className } = parentElement;
	let keyToSave = localName;
	if (id) {
		keyToSave += `#${id}`;
	}
	if (className) {
		keyToSave += `.${className}`;
	}
	const elements = document.querySelectorAll(keyToSave);
	if (elements.length > 1) {
		keyToSave += `[${[...elements].indexOf(parentElement)}]`;
	}
	return keyToSave;
};

export class SaveModificationCommand implements Command {
	private prevModifications;
	constructor(
		private localStorage: Storage,
		private modification: DOMModification,
	) {
		this.prevModifications = JSON.parse(
			localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}",
		);
	}

	execute(): void {
		const { keyToSave, nextText, previousText } = this.modification;
        const { previousText: previousTextFromStorage} = this.prevModifications[keyToSave] || {}
		this.localStorage.setItem(
			MOCKSI_MODIFICATIONS,
			JSON.stringify({
				...this.prevModifications,
				[keyToSave]: { nextText, previousText: previousTextFromStorage || previousText },
			}),
		);
	}

	undo(): void {
		const { keyToSave, previousText } = this.modification;
		this.localStorage.setItem(
			MOCKSI_MODIFICATIONS,
			JSON.stringify({
				...this.prevModifications,
				[keyToSave]: { previousText },
			}),
		);
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
