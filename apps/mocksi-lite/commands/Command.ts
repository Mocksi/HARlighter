export interface Command {
	execute(): void;
	undo(): void;
}

interface DOMModification {
	previousKey: string;
	keyToSave: string;
	oldValue: string;
	newValue: string;
	type: "text" | "image";
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
		private prevModifications: {
			[querySelector: string]:
				| {
						newValue: string;
						oldValue: string;
						type: "text" | "image";
				  }
				| undefined;
		},
		private modification: DOMModification,
	) {}

	execute() {
		const { keyToSave, previousKey, newValue, oldValue, type } =
			this.modification;
		const { oldValue: oldValueFromStorage } =
			this.prevModifications[previousKey] || {};
		if (this.prevModifications[previousKey]) {
			this.prevModifications[previousKey] = undefined;
		}
		this.prevModifications[keyToSave] = {
			newValue,
			oldValue: oldValueFromStorage || oldValue,
			type,
		};
	}

	undo() {
		const { keyToSave, oldValue, type } = this.modification;
		this.resetPrevModifications(keyToSave, oldValue, type);
	}

	private resetPrevModifications(
		key: string,
		oldValue: string,
		type: "text" | "image",
	) {
		this.prevModifications[key] = { oldValue, newValue: "", type };
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
