import MocksiRollbar from "./MocksiRollbar";
import type { Alteration } from "./background";
import type { Recording } from "./background";
import {
	type Command,
	SaveModificationCommand,
	buildQuerySelector,
} from "./commands/Command";
import {
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	RecordingState,
	STORAGE_KEY,
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
	// localStorage.removeItem(MOCKSI_MODIFICATIONS);
};

export const undoModifications = () => {
	loadModifications();
	localStorage.removeItem(MOCKSI_MODIFICATIONS);
};

const modifyElementInnerHTML = (selector: string, content: string) => {
	const hasIndex = selector.match(/\[[0-9]+\]/);
	let elemToModify: Element | null;

	if (hasIndex) {
		const index: number = +hasIndex[0].replace("[", "").replace("]", "");
		elemToModify =
			document.querySelectorAll(selector.replace(hasIndex[0], ""))[index] ||
			null;
	} else {
		elemToModify = document.querySelector(selector) || null;
	}

	if (elemToModify !== null) {
		elemToModify.innerHTML = content;
	}
};

// v2 of loading alterations, this is from backend
export const loadAlterations = (alterations: Alteration[]) => {
	for (const alteration of alterations) {
		const { selector, dom_after } = alteration;
		modifyElementInnerHTML(selector, dom_after);
	}
};

// This is from localStorage
export const loadModifications = () => {
	const modifications: DOMModificationsType = getModificationsFromStorage();
	for (const modification of Object.entries(modifications)) {
		const [querySelector, { previousText }] = modification;
		modifyElementInnerHTML(querySelector, previousText);
	}
};

const getModificationsFromStorage = (): DOMModificationsType => {
	try {
		return JSON.parse(localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}");
	} catch (error) {
		console.error("Error parsing modifications:", error);
		return {};
	}
};

export const sendMessage = (
	message: string,
	body?: Record<string, unknown> | null,
) =>
	chrome.runtime.sendMessage({ message, body }, (response) => {
		if (response?.status !== "success") {
			console.error("Failed to send message to background script");
		}
	});

export const getEmail = async (): Promise<string | null> => {
	const value = await chrome.storage.local.get(STORAGE_KEY);
	if (!value) {
		window.open(SignupURL);
		return null; // Ensure a value is always returned
	}

	const storedData = value[STORAGE_KEY] || "{}";
	try {
		const parsedData = JSON.parse(storedData);
		return parsedData.email;
	} catch (error) {
		console.log("Error parsing data from storage: ", error);
		MocksiRollbar.log("Error parsing email data, logging out.");
		logout();
		return null;
	}
};

export const getRecordingsStorage = async (): Promise<Recording[]> => {
	try {
		const results = await chrome.storage.local.get(["recordings"]);
		console.log(results.recordings);
		if (results.recordings) {
			return JSON.parse(results.recordings);
		}
		return [];
	} catch (err) {
		console.error("Failed to retrieve recordings:", err);
		throw err;
	}
};
