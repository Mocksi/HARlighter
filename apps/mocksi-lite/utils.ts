import {
	COOKIE_NAME,
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "./consts";

export const setRootPosition = (state: RecordingState) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		const bottom =
			state === RecordingState.READY || state === RecordingState.CREATE;
		extensionRoot.className = bottom ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	document.cookie = `${COOKIE_NAME}=`;
	localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.UNAUTHORIZED);
};

export const saveModification = (
	parentElement: HTMLElement,
	newText: string,
) => {
	const prevModifications = JSON.parse(
		localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}",
	);
	let keyToSave = parentElement.localName;
	if (parentElement.id) {
		keyToSave += `#${parentElement.id}`;
	}
	if (parentElement.className) {
		keyToSave += `.${parentElement.className}`;
	}
	// here we check if the key we built is sufficient to get an unique element when querying
	const elements = document.querySelectorAll(keyToSave);
	if (elements.length === 1) {
		localStorage.setItem(
			MOCKSI_MODIFICATIONS,
			JSON.stringify({ ...prevModifications, [keyToSave]: newText }),
		);
	} else {
		// if not unique, we search for the index and put it on the key.
		keyToSave += `[${[...elements].indexOf(parentElement)}]`;
		localStorage.setItem(
			MOCKSI_MODIFICATIONS,
			JSON.stringify({ ...prevModifications, [keyToSave]: newText }),
		);
	}
};

export const loadModifications = () => {
	const modifications = JSON.parse(
		localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}",
	);
	for (const modification of Object.entries(modifications)) {
		const [querySelector, value] = modification;
		const hasIndex = querySelector.match(/\[+[0-9]\]/);
		if (hasIndex) {
			const index: number = +hasIndex[0].replace("[", "").replace("]", "");
			const elemToModify = document.querySelectorAll(
				querySelector.replace(hasIndex[0], ""),
			)[index];
			//@ts-ignore EXTREMELY INSECURE!!!!!!!!
			elemToModify.innerHTML = value;
		} else {
			const [elemToModify] = document.querySelectorAll(querySelector);
			//@ts-ignore EXTREMELY INSECURE!!!!!!!!
			elemToModify.innerHTML = value;
		}
	}
	console.log("loadedModifications!", modifications);
};
