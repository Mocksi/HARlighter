import { DOMManipulator } from "@repo/dodom";
import { modifyHtml } from "@repo/reactor";
import auth0, { type WebAuth } from "auth0-js";
import sanitizeHtml from "sanitize-html";
import { debug } from "webpack";
import MocksiRollbar from "./MocksiRollbar";
import type { Alteration } from "./background";
import type { Recording } from "./background";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_LAST_PAGE_DOM,
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_ID,
	MOCKSI_RECORDING_STATE,
	STORAGE_KEY,
	SignupURL,
} from "./consts";
import { AppState } from "./content/AppStateContext";
import { fragmentTextNode } from "./content/EditMode/actions";
import { getHighlighter } from "./content/EditMode/highlighter";
import { Storage } from './content/utils/Storage';

type DomAlteration = {
	newValue: string;
	oldValue: string;
	type: "image" | "text";
};

type DOMModificationsType = {
	[querySelector: string]: DomAlteration;
};

const authOptions: auth0.AuthOptions = {
	audience: "Mocksi Lite",
	clientID: "3XDxVDUz3W3038KmRvkJSjkIs5mGj7at",
	domain: "dev-3lgt71qosvm4psf0.us.auth0.com",
	redirectUri: "https://nest-auth-ts-merge.onrender.com",
	// TODO: change to include offline_access, see https://github.com/Mocksi/nest/pull/10#discussion_r1635647560
	responseType: "id_token token",
};

export const setRootPosition = (state: null | AppState) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		const bottom =
			state === AppState.READYTORECORD ||
			state === AppState.CREATE ||
			state === AppState.HIDDEN ||
			state === AppState.PLAY;
		extensionRoot.className = bottom ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	// FIXME: this should redirect to a logout page first
	const webAuth: WebAuth = new auth0.WebAuth(authOptions);
	chrome.storage.local.clear(() => {
		chrome.storage.local.set(
			{
				[MOCKSI_RECORDING_STATE]: AppState.UNAUTHORIZED,
			},
			() =>
				webAuth.logout({
					clientID: authOptions.clientID,
					returnTo: authOptions.redirectUri,
				}),
		);
	});
};

export const persistModifications = async (
	recordingId: string,
	alterations: Alteration[],
) => {
	const updated_timestamp = new Date();
	await updateRecordingsStorage({
		alterations,
		updated_timestamp,
		uuid: recordingId,
	});

	// Return a promise here so we can "await" the response
	// This allows us to ensure the demo has been updated before taking the next action (ie. closing the editor)
	return new Promise((resolve) => {
		sendMessage(
			"updateDemo",
			{
				id: recordingId,
				recording: { alterations, updated_timestamp },
			},
			(response) => {
				resolve(response);
			},
		);
	});
};

export const undoModifications = async (alterations: Alteration[]) => {
	loadPreviousModifications(alterations); // revert
	await chrome.storage.local.remove(MOCKSI_ALTERATIONS);
	getHighlighter().removeHighlightNodes();
};

// v2 of loading alterations, this is from backend
export const loadAlterations = async (
	alterations: null | Alteration[],
	options: { createdAt?: Date; withHighlights: boolean },
) => {
	const { createdAt, withHighlights } = options;

	if (!alterations?.length) {
		// FIXME: we should warn the user that there are no alterations for this demo
		console.debug("No alterations found while trying to load, cancelling load");
		return;
	}

	const domManipulator = new DOMManipulator(
		fragmentTextNode,
		getHighlighter(),
		() => {},
	);

	for (const alteration of alterations) {
		const { dom_after, dom_before, selector, type } = alteration;
		const elemToModify = getHTMLElementFromSelector(selector);
		const body = document.querySelector("body");
		if (body) {
			if (type === "text") {
				domManipulator.iterateAndReplace(
					body as Node,
					new RegExp(dom_before, "g"),
					sanitizeHtml(dom_after),
					withHighlights,
				);
			} else if (type === "image" && elemToModify instanceof HTMLImageElement) {
				domManipulator.replaceImage(dom_before, dom_after);
			}
		}
	}

	function getTimestamps(): { selector: string; date: Date }[] {
		const dateRegex =
			/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2}$/;
		const allSpans = document.querySelectorAll("span");
		const timestamps: { selector: string; date: Date }[] = [];

		for (const span of allSpans) {
			const text = span.textContent?.trim();
			if (text && dateRegex.test(text)) {
				const date = parseDate(text);
				if (date) {
					const selector = getCssSelector(span);
					timestamps.push({ date, selector });
				}
			}
		}

		return timestamps;
	}

	function parseDate(dateText: string): null | Date {
		const currentYear = new Date().getFullYear();
		const fullDateText = `${dateText}, ${currentYear}`;
		const date = new Date(fullDateText);

		if (Number.isNaN(date.getTime())) {
			return null;
		}

		// If the parsed date is in the future, assume it's for the previous year
		if (date > new Date()) {
			date.setFullYear(currentYear - 1);
		}

		return date;
	}

	function getCssSelector(element: Element): string {
		if (!(element instanceof Element)) {
			return "";
		}
		let selector = element.className
			.split(" ")
			.map((c) => `.${c}`)
			.join("");
		const parentWithClass = element.closest("[class]");
		if (parentWithClass && parentWithClass !== element) {
			selector = `${parentWithClass.className.split(" ")[0]} ${selector}`;
		}
		return selector;
	}

	const timestamps = getTimestamps();
	const now = new Date();
	await Promise.all(
		timestamps.map(async (timestamp) => {
			const userRequest = JSON.stringify({
				modifications: [
					{
						action: "updateTimestampReferences",
						selector: timestamp.selector,
						timestampRef: {
							currentTime: now.toISOString(),
							recordedAt: createdAt?.toString(),
						},
					},
				],
			});
			console.log("userRequest", userRequest);
			const contents = document.querySelectorAll(timestamp.selector);
			for (const content of contents) {
				try {
					const result = await modifyHtml(content.outerHTML, userRequest);
					const parser = new DOMParser();
					const doc = parser.parseFromString(result, "text/html");

					if (doc.body) {
						// Replace the original content with the modified content
						content.outerHTML = doc.body.innerHTML;
					} else {
						console.error("Parsed document body is null or undefined");
					}
				} catch (error) {
					console.error(
						"Error updating innerHTML for",
						timestamp.selector,
						error,
					);
				}
			}
		}),
	);
};

// This is from chrome.storage.local
// this should be called "revertModifications"
export const loadPreviousModifications = (alterations: Alteration[]) => {
	for (const alteration of alterations) {
		const { dom_after, dom_before, selector, type } = alteration;

		const sanitizedOldValue = sanitizeHtml(dom_before);
		const elemToModify = getHTMLElementFromSelector(selector);
		// here newValue and oldValue is in altered order because we want to revert the changes
		if (type === "text" && elemToModify) {
			elemToModify.innerHTML = elemToModify.innerHTML.replaceAll(
				dom_after,
				sanitizedOldValue,
			);
		} else if (type === "image" && elemToModify instanceof HTMLImageElement) {
			elemToModify.src = dom_before;
		}
	}
};

const formatQuerySelector = (
	rawSelector: string,
	valueInQuerySelector: null | RegExpMatchArray,
	hasIndex: null | RegExpMatchArray,
) => {
	// querySelector format {htmlElementType}#{elementId}.{elementClassnames}[${elementIndexIfPresent}]{{newValue}}
	const [index] = hasIndex || [""];
	const [value] = valueInQuerySelector || [""];
	return rawSelector.replace(index, "").replace(value, "");
};

const getHTMLElementFromSelector = (
	unfomattedSelector: string,
): null | Element => {
	const hasIndex = unfomattedSelector.match(/\[[0-9]+\]/);
	const valueInQuerySelector = unfomattedSelector.match(/\{.+\}/);
	const formattedSelector = formatQuerySelector(
		unfomattedSelector,
		hasIndex,
		valueInQuerySelector,
	);
	let elemToModify: null | NodeListOf<Element>;
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
		return elemToModify[index];
	}
	return elemToModify;
};

export const sendMessage = async (
	message: string,
	body?: null | Record<string, unknown>,
	callback: (response: Record<string, unknown>) => void = () => {},
) => {
	try {
<<<<<<< HEAD
		console.log('trying', message, body);
		const response = await chrome.runtime.sendMessage({ message, body })
		console.log('response', message, response.status);
		if (response?.status !== "success") {
			console.log('error time', message, response.status)
			throw new Error(
				`Failed to send message to background script. Received response: ${response}`,
			);
		}
=======
		chrome.runtime.sendMessage({ body, message }, (response) => {
			if (response?.status !== "success") {
				throw new Error(
					`Failed to send message to background script. Received response: ${response}`,
				);
			}
>>>>>>> main

		callback(response);
	} catch (error) {
		console.log('error time 2', error);
		console.error("Error sending message to background script:", error);
		logout();
	}
};
// biome-ignore lint/suspicious/noExplicitAny: dynamic arguments
export function debounce_leading<T extends (...args: any[]) => void>(
	func: T,
	timeout = 300,
): (...args: Parameters<T>) => void {
	let timer: undefined | number;

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

export const getLastPageDom = async () => {
	const value = await Storage.getItem([MOCKSI_LAST_PAGE_DOM]);
	return value[MOCKSI_LAST_PAGE_DOM];
};

export const getEmail = async (): Promise<null | string> => {
	const value = await chrome.storage.local.get(STORAGE_KEY);
	if (!value) {
		window.open(SignupURL);
		return null; // Ensure a value is always returned
	}

	const storedData = value[STORAGE_KEY] || "{}";
	try {
		const parsedData = JSON.parse(storedData);
		if (!parsedData.email) {
			const configPayload = {
				payload: {
					person: {
						email: parsedData.email,
						id: parsedData.userId,
					},
				},
			};
			console.log("configuring rollbar with user data", parsedData);
			MocksiRollbar.configure(configPayload);
		}
		return parsedData.email;
	} catch (error) {
		console.log("Error parsing data from storage: ", error);
		MocksiRollbar.log("Error parsing email data, logging out.");
		logout();
		return null;
	}
};
export const getAlterations = async (): Promise<Alteration[] | []> => {
	const value = await Storage.getItem([MOCKSI_ALTERATIONS]);
	const storedData = value[MOCKSI_ALTERATIONS];

	return storedData ?? [];
};

export const getRecordingsStorage = async (): Promise<Recording[]> => {
	try {
		const results = await Storage.getItem(["recordings"]);
		if (results.recordings) {
			return JSON.parse(results.recordings);
		}
		return [];
	} catch (err) {
		console.error("Failed to retrieve recordings:", err);
		throw err;
	}
};

export const updateRecordingsStorage = async ({
	alterations,
	updated_timestamp,
	uuid,
}: {
	alterations: Alteration[];
	updated_timestamp: Date;
	uuid: string;
}) => {
	try {
		const recordingsFromStorage = await getRecordingsStorage();
		const modifiedRecordings = recordingsFromStorage.map((recording) =>
			recording.uuid === uuid
				? { ...recording, alterations, updated_timestamp, uuid }
				: recording,
		);
		const sorted = modifiedRecordings.sort((a: Recording, b: Recording) =>
			a.updated_timestamp > b.updated_timestamp ? -1 : 0,
		);
		const recordingsStringified = JSON.stringify(sorted);
		console.log("modified", recordingsFromStorage, sorted);
		Storage.setItem({ recordings: recordingsStringified });
	} catch (err) {
		console.error("Failed to save modifications from LS:", err);
		throw err;
	}
};
export const loadRecordingId = async () => {
<<<<<<< HEAD
	const result = await Storage.getItem([MOCKSI_RECORDING_ID])
	return result[MOCKSI_RECORDING_ID]
=======
	return new Promise<undefined | string>((resolve) => {
		chrome.storage.local.get([MOCKSI_RECORDING_ID], (result) => {
			resolve(result[MOCKSI_RECORDING_ID]);
		});
	});
>>>>>>> main
};

export const recordingLabel = (currentStatus: AppState) => {
	switch (currentStatus) {
		case AppState.ANALYZING:
			return "Analyzing...";
		case AppState.EDITING:
			return "Editing Template";
		case AppState.READYTORECORD:
			return "Start recording";
		case AppState.RECORDING:
			return "Mocksi Recording";
		case AppState.UNAUTHORIZED:
			return "Login to record";
		default:
			return "Start recording";
	}
};

export const innerHTMLToJson = (innerHTML: string): string => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(innerHTML, "text/html");

	function elementToJson(element: Element): object {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const obj: any = {};

		obj.tag = element.tagName.toLowerCase();

		if (element.attributes.length > 0) {
			obj.attributes = {};
			for (const attr of Array.from(element.attributes)) {
				obj.attributes[attr.name] = attr.value;
			}
		}

		if (element.children.length > 0) {
			obj.children = Array.from(element.children).map((child) =>
				elementToJson(child),
			);
		} else {
			obj.text = element.textContent;
		}

		return obj;
	}

	// Convert the body of the parsed document to JSON
	const json = Array.from(doc.body.children).map((child) =>
		elementToJson(child),
	);
	const body = json.length === 1 ? json[0] : json;

	return JSON.stringify(body);
};

// This function is used to extract styles from the stylesheets that contain the "--mcksi-frame-include: true;" rule
export const extractStyles = (
	stylesheets: DocumentOrShadowRoot["styleSheets"],
): string => {
	let styles = "";
	const styleSheets = Array.from(stylesheets) as CSSStyleSheet[];
	for (const sheet of styleSheets) {
		// Skip external stylesheets
		if (sheet.href) {
			continue;
		}
		try {
			if (sheet.cssRules) {
				const cssRules = Array.from(sheet.cssRules) as CSSRule[];
				// Check if the stylesheet contains the "--mcksi-frame-include: true;" rule
				const includesMcksiFrameInclude = cssRules.some((rule) => {
					if ("style" in rule) {
						return (
							(rule as CSSStyleRule).style.getPropertyValue(
								"--mcksi-frame-include",
							) === "true"
						);
					}
					return false;
				});
				if (includesMcksiFrameInclude) {
					for (const rule of cssRules) {
						styles += `${rule.cssText}\n`;
					}
				}
			}
		} catch (e) {
			console.error("Error accessing stylesheet:", e);
		}
	}

	return styles.trim();
};
