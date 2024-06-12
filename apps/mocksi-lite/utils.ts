import {
	MOCKSI_ACCESS_TOKEN,
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	MOCKSI_SESSION_ID,
	MOCKSI_USER_ID,
	RecordingState,
	SignupURL,
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
	localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.UNAUTHORIZED);
	localStorage.removeItem(MOCKSI_ACCESS_TOKEN);
	localStorage.removeItem(MOCKSI_USER_ID);
	localStorage.removeItem(MOCKSI_SESSION_ID);
  chrome.storage.local.clear()
	window.open(SignupURL);
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
		// value here is encoded, SHOULD NOT be a security risk to put it in the innerHTML
		const [querySelector, value] = modification;
		const hasIndex = querySelector.match(/\[[0-9]+\]/);
		if (hasIndex) {
			const index: number = +hasIndex[0].replace("[", "").replace("]", "");
			const elemToModify = document.querySelectorAll(
				querySelector.replace(hasIndex[0], ""),
			)[index];
			//@ts-ignore
			elemToModify.innerHTML = value;
		} else {
			const [elemToModify] = document.querySelectorAll(querySelector);
			//@ts-ignore
			elemToModify.innerHTML = value;
		}
	}
};

export const sendMessage = (
	message: string,
	body?: Record<string, unknown> | null,
) =>
	chrome.runtime.sendMessage({ message, body }, (response) => {
		if (response?.status !== "success") {
			console.error("Failed to send message to background script");
			return;
		}
	});
