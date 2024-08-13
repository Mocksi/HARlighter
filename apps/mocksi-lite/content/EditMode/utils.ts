export const applyStyles = (
	element: HTMLElement,
	styles: Record<string, string>,
) => {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value);
	}
};

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
		const escapedClasses = [...classList].map((cls) => CSS.escape(cls));
		keyToSave += `.${escapedClasses.join(".")}`;
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
