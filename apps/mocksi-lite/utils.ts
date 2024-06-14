import type { Alteration } from "./background";
import {
	type Command,
	SaveModificationCommand,
	buildQuerySelector,
} from "./commands/Command";
import {
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	RecordingState,
	SignupURL,
} from "./consts";

type DOMModificationsType = {
	[querySelector: string]: { nextText: string; previousText: string };
};

export const setRootPosition = (state: RecordingState) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		const bottom =
			state === RecordingState.READY || state === RecordingState.CREATE;
		extensionRoot.className = bottom ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	localStorage.clear();
	chrome.storage.local.clear();
	localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.UNAUTHORIZED);
	window.open(SignupURL);
};

const commandsExecuted: Command[] = [];

export const saveModification = (
	parentElement: HTMLElement,
	newText: string,
	previousText: string,
) => {
	const saveModificationCommand = new SaveModificationCommand(localStorage, {
		keyToSave: buildQuerySelector(parentElement),
		nextText: newText,
		previousText,
	});
	commandsExecuted.push(saveModificationCommand);
	saveModificationCommand.execute();
};

export const persistModifications = (recordingId: string) => {
	const modificationsFromStorage = getModificationsFromStorage()
	const alterations: Alteration[] = Object.entries<{
		nextText: string;
		previousText: string;
	}>(modificationsFromStorage).map(
		([querySelector, { nextText, previousText }]) => ({
			selector: querySelector,
			action: previousText ? "modified" : "added",
			dom_before: previousText || "",
			dom_after: nextText,
		}),
	);
	const updated_timestamp = new Date();
	sendMessage("updateDemo", {
		id: recordingId,
		recording: { updated_timestamp, alterations },
	});
	// localStorage.removeItem(MOCKSI_MODIFICATIONS);
};

export const undoModifications = () => {
	loadModifications();
	localStorage.removeItem(MOCKSI_MODIFICATIONS);
};

// v2 of loading alterations, this is from backend
export const loadAlterations = (alterations: Alteration[]) => {
	for (const alteration of alterations) {
		const { selector, dom_after } = alteration;
		const hasIndex = selector.match(/\[[0-9]+\]/);
		if (hasIndex) {
			const index: number = +hasIndex[0].replace("[", "").replace("]", "");
			const elemToModify = document.querySelectorAll(
				selector.replace(hasIndex[0], ""),
			)[index];
			//@ts-ignore
			elemToModify.innerHTML = dom_after;
		} else {
			const [elemToModify] = document.querySelectorAll(selector);
			//@ts-ignore
			elemToModify.innerHTML = dom_after;
		}
	}
};

// This is from localStorage
export const loadModifications = () => {
	const modifications: DOMModificationsType = getModificationsFromStorage()
	for (const modification of Object.entries(modifications)) {
		// value here is encoded, SHOULD NOT be a security risk to put it in the innerHTML
		const [querySelector, { previousText }] = modification;
		const hasIndex = querySelector.match(/\[[0-9]+\]/);
		if (hasIndex) {
			const index: number = +hasIndex[0].replace("[", "").replace("]", "");
			const elemToModify = document.querySelectorAll(
				querySelector.replace(hasIndex[0], ""),
			)[index];
			//@ts-ignore
			elemToModify.innerHTML = previousText;
		} else {
			const [elemToModify] = document.querySelectorAll(querySelector);
			//@ts-ignore
			elemToModify.innerHTML = previousText;
		}
	}
};

const getModificationsFromStorage = () => {
	try {
		return JSON.parse(localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}");
		} catch (error) {
		console.error("Error parsing modifications:", error);
	}
}

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
