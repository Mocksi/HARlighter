import sanitizeHtml from "sanitize-html";
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
import { DOMManipulator } from "@repo/dodom";
import { fragmentTextNode } from "./content/EditMode/actions";
import { ContentHighlighter } from "./content/EditMode/highlighter";

type DOMModificationsType = {
	[querySelector: string]: { nextText: string; previousText: string };
};

export const setRootPosition = (state: RecordingState | null) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		const bottom =
			state === RecordingState.READY || state === RecordingState.CREATE;
		extensionRoot.className = bottom ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	chrome.storage.local.clear(() => {
		chrome.storage.local.set({
			[MOCKSI_RECORDING_STATE]: RecordingState.UNAUTHORIZED,
		});
	});
	// FIXME: this should redirect to a logout page first
	window.open(SignupURL);
};

const commandsExecuted: Command[] = [];

const domainModifications: DOMModificationsType = {};

export const saveModification = (
	parentElement: HTMLElement,
	newText: string,
	previousText: string,
) => {
	const saveModificationCommand = new SaveModificationCommand(
		domainModifications,
		{
			keyToSave: buildQuerySelector(parentElement, newText),
			nextText: sanitizeHtml(newText),
			previousText,
		},
	);
	commandsExecuted.push(saveModificationCommand);
	saveModificationCommand.execute();
};

export const persistModifications = (recordingId: string) => {
	const alterations: Alteration[] = buildAlterations(domainModifications);
	chrome.storage.local.set({
		[MOCKSI_MODIFICATIONS]: JSON.stringify(domainModifications),
	});
	const updated_timestamp = new Date();
	sendMessage("updateDemo", {
		id: recordingId,
		recording: { updated_timestamp, alterations },
	});
};

export const undoModifications = () => {
	loadPreviousModifications();
	chrome.storage.local.remove(MOCKSI_MODIFICATIONS);
};

// v2 of loading alterations, this is from backend
export const loadAlterations = (alterations: Alteration[] | null) => {
	if (!alterations?.length) {
		// FIXME: we should warn the user that there are no alterations for this demo
		return [] as Alteration[];
	}
	const domManipulator = new DOMManipulator(fragmentTextNode, ContentHighlighter, saveModification)
	for (const alteration of alterations) {
		const { selector, dom_after, dom_before } = alteration;
		const elemToModify = getHTMLElementFromSelector(selector)
		debugger
		domManipulator.iterateAndReplace(elemToModify as Node, new RegExp(dom_before, "gi"), sanitizeHtml(dom_after), true)
	}
};

// This is from chrome.storage.local
export const loadPreviousModifications = () => {
	for (const modification of Object.entries(domainModifications)) {
		const [querySelector, { previousText, nextText }] = modification;
		const sanitizedPreviousText = sanitizeHtml(previousText);
		const elemToModify = getHTMLElementFromSelector(querySelector)
		// here newText and previous is in altered order because we want to revert the changes
		if (elemToModify) {
			elemToModify.innerHTML = elemToModify.innerHTML.replaceAll(nextText, sanitizedPreviousText)
		}
		// modifyElementInnerHTML(querySelector, nextText, sanitizedPreviousText);
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
		// FIXME: lots of duplicated code here
		try {
			elemToModify = document.querySelectorAll(filteredQuerySelector)[index];
		} catch (e: unknown) {
			if (e instanceof Error) {
				console.error(`Error querying selector: ${e}`);
			}

			elemToModify = null;
		}
	}
};

const formatQuerySelector = (
	rawSelector: string,
	valueInQuerySelector: RegExpMatchArray | null,
	hasIndex: RegExpMatchArray | null,
) => {
	// querySelector format {htmlElementType}#{elementId}.{elementClassnames}[${elementIndexIfPresent}]{{newValue}}
	const [index] = hasIndex || ['']
	const [value] = valueInQuerySelector || [''] 
	return rawSelector
		.replace(index, "")
		.replace(value, "")
};

const getHTMLElementFromSelector = (unfomattedSelector: string): Element | null => {
	const hasIndex = unfomattedSelector.match(/\[[0-9]+\]/);
	const valueInQuerySelector = unfomattedSelector.match(/\{.+\}/);
	const formattedSelector = formatQuerySelector(unfomattedSelector, hasIndex, valueInQuerySelector)
	let elemToModify: NodeListOf<Element> | null;
	try {
		elemToModify = document.querySelectorAll(formattedSelector);
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.error(`Error querying selector: ${e}`);
		}
		elemToModify = null;
	}
	if (elemToModify) {
		const index = hasIndex ? +hasIndex[0].replace("[", "").replace("]", "") : 0;
		return elemToModify[index]
	} 
	return elemToModify
}

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

const buildAlterations = (
	modifications: DOMModificationsType,
): Alteration[] => {
	return Object.entries(modifications).map(
		([querySelector, { nextText, previousText }]) => ({
			selector: querySelector,
			action: previousText ? "modified" : "added",
			dom_before: previousText || "",
			dom_after: nextText,
		}),
	);
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
