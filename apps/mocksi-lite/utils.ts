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
		modifyElementInnerHTML(selector, dom_before, dom_after);
	}
};

// This is from localStorage
export const loadPreviousModifications = () => {
	const modifications: DOMModificationsType = getModificationsFromStorage();
	for (const modification of Object.entries(modifications)) {
		// value here is encoded, SHOULD NOT be a security risk to put it in the innerHTML
		const [querySelector, { previousText, nextText }] = modification;
		// here newText and previous is in altered order because we want to revert the changes
		modifyElementInnerHTML(querySelector, nextText, previousText);
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

const modifyElementInnerHTML = (
	selector: string,
	oldContent: string,
	newContent: string,
) => {
	// querySelector format {htmlElementType}#{elementId}.{elementClassnames}[${elementIndexIfPresent}]{{newValue}}
	const hasIndex = selector.match(/\[[0-9]+\]/);
	const valueInQuerySelector = selector.match(/\{[a-zA-Z0-9 ]+\}/); // add spaces to pattern
	let elemToModify: Element | null;
	// FIXME: this needs to be refactored
	if (hasIndex) {
		// with all this replaces, we should build a formatter
		const filteredQuerySelector = formatQuerySelector(
			selector,
			valueInQuerySelector,
			hasIndex,
		);
		const index: number = +hasIndex[0].replace("[", "").replace("]", "");
		try {
			elemToModify = document.querySelectorAll(filteredQuerySelector)[index];
		} catch (error: any) {
			console.error("Error querying selector:", error);
			elemToModify = null;
		}
	} else {
		// FIXME: lots of duplicated code here
		try {
			elemToModify = document.querySelector(
				formatQuerySelector(selector, valueInQuerySelector, null),
			);
		} catch (error: any) {
			elemToModify = null;
		}
	}
	if (elemToModify !== null) {
		elemToModify.innerHTML =
			elemToModify?.innerHTML?.replaceAll(oldContent, newContent) || "";
	}
};

const formatQuerySelector = (
	rawSelector: string,
	valueInQuerySelector: RegExpMatchArray | null,
	hasIndex: RegExpMatchArray | null,
) => {
	if (hasIndex) {
		return valueInQuerySelector
			? rawSelector
					.replace(hasIndex[0], "")
					.replace(valueInQuerySelector[0], "")
			: rawSelector.replace(hasIndex[0], "");
	}

	return valueInQuerySelector
		? rawSelector.replace(valueInQuerySelector[0], "")
		: rawSelector;
};

export const sendMessage = (
	message: string,
	body?: Record<string, unknown> | null,
) => {
	try {
		chrome.runtime.sendMessage({ message, body }, (response) => {
			if (response?.status !== "success") {
				throw new Error(
					`Failed to send message to background script. Received response: ${response}`,
				);
			}
		});
	} catch (error) {
		console.error("Error sending message to background script:", error);
		logout();
	}
};

// biome-ignore lint/suspicious/noExplicitAny: dynamic arguments
export function debounce_leading<T extends (...args: any[]) => void>(
	func: T,
	timeout = 300,
): (...args: Parameters<T>) => void {
	let timer: number | undefined;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		if (!timer) {
			func.apply(this, args);
		}
		clearTimeout(timer);
		timer = window.setTimeout(() => {
			timer = undefined;
		}, timeout);
	};
}
