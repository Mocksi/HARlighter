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
	private prevModifications: Record<string, DOMModification>;

	constructor(
		private storage: typeof chrome.storage.local,
		private modification: DOMModification,
	) {
		this.prevModifications = {};
		this.loadPreviousModifications();
	}

	private async loadPreviousModifications(): Promise<void> {
		return new Promise((resolve) => {
			this.storage.get([MOCKSI_MODIFICATIONS], (result) => {
				try {
					this.prevModifications = JSON.parse(
						result[MOCKSI_MODIFICATIONS] || "{}",
					);
				} catch (error) {
					console.error("Error parsing JSON:", error);
					this.prevModifications = {};
				}
				resolve();
			});
		});
	}

	async execute(): Promise<void> {
		await this.loadPreviousModifications();

		const { keyToSave, nextText, previousText } = this.modification;
		const { previousText: previousTextFromStorage } =
			this.prevModifications[keyToSave] || {};

		this.storage.set({
			[MOCKSI_MODIFICATIONS]: JSON.stringify({
				...this.prevModifications,
				[keyToSave]: {
					nextText,
					previousText: previousTextFromStorage || previousText,
				},
			}),
		});
	}

	async undo(): Promise<void> {
		await this.loadPreviousModifications();

		const { keyToSave, previousText } = this.modification;
		this.storage.set({
			[MOCKSI_MODIFICATIONS]: JSON.stringify({
				...this.prevModifications,
				[keyToSave]: { previousText },
			}),
		});
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
