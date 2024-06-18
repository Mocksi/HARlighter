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
		keyToSave: buildQuerySelector(parentElement, newText),
		nextText: newText,
		previousText,
	});
	commandsExecuted.push(saveModificationCommand);
	saveModificationCommand.execute();
};

export const persistModifications = (recordingId: string) => {
	const modificationsFromStorage = getModificationsFromStorage();
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
};

export const undoModifications = () => {
	loadPreviousModifications();
	localStorage.removeItem(MOCKSI_MODIFICATIONS);
};

// v2 of loading alterations, this is from backend
export const loadAlterations = (alterations: Alteration[]) => {
	for (const alteration of alterations) {
		const { selector, dom_after, dom_before } = alteration;
		applyChanges(selector, dom_before, dom_after);
	}
};

// This is from localStorage
export const loadPreviousModifications = () => {
	const modifications: DOMModificationsType = getModificationsFromStorage();
	for (const modification of Object.entries(modifications)) {
		// value here is encoded, SHOULD NOT be a security risk to put it in the innerHTML
		const [querySelector, { previousText, nextText }] = modification;
		// here newText and previous is in altered order because we want to revert the changes
		applyChanges(querySelector, nextText, previousText);
	}
};

const getModificationsFromStorage = () => {
	try {
		return JSON.parse(localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}");
	} catch (error) {
		console.error("Error parsing modifications:", error);
	}
};

const applyChanges = (
	querySelector: string,
	oldValue: string,
	newValue: string,
) => {
	const hasIndex = querySelector.match(/\[[0-9]+\]/);
	const valueInQuerySelector = querySelector.match(/\{[a-zA-Z0-9]+\}/);
	if (hasIndex) {
		const filteredQuerySelector = valueInQuerySelector
			? querySelector
					.replace(hasIndex[0], "")
					.replace(valueInQuerySelector[0], "")
			: querySelector.replace(hasIndex[0], "");
		const index: number = +hasIndex[0].replace("[", "").replace("]", "");
		const elemToModify = document.querySelectorAll(filteredQuerySelector)[
			index
		];
		//@ts-ignore
		elemToModify.innerHTML =
			elemToModify?.innerHTML?.replaceAll(oldValue, newValue) || "";
	} else {
		const elemToModify = document.querySelector(
			valueInQuerySelector
				? querySelector.replace(valueInQuerySelector[0], "")
				: querySelector,
		);
		//@ts-ignore
		elemToModify.innerHTML =
			elemToModify?.innerHTML?.replaceAll(oldValue, newValue) || "";
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
