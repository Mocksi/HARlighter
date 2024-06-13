import {
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	RecordingState,
	SignupURL,
} from "./consts";
import { Command, SaveModificationCommand, buildQuerySelector } from "./commands/Command";
import { Alteration } from "./background";

type DOMModifcationsType = {[querySelector: string]: {nextText: string, previousText: string}}

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

const commandsExecuted: Command[] = []

export const saveModification = (
	parentElement: HTMLElement,
	newText: string,
) => {
	// to successfully implement the do/undo commands, we must save somewhere in memory all commands being executed.
	const saveModificationCommand = new SaveModificationCommand(
		localStorage,
		{
			keyToSave: buildQuerySelector(parentElement),
			nextText: newText,
			previousText: parentElement.innerHTML // todo test previous
		}
	)
	commandsExecuted.push(saveModificationCommand)
	saveModificationCommand.execute();
};

export const persistModifications = (
	recordingId: string
) => {
	const alterations: Alteration[] = Object.entries<{nextText: string, previousText: string}>(
		JSON.parse(
			localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}",
		)
	).map(
		([querySelector, {nextText, previousText}]) => ({
			selector: querySelector,
			action: previousText ? 'modified' : 'added',
			dom_before: previousText,
			dom_after: nextText
		})
	)
	console.log(alterations)
	const updated_timestamp = new Date()
	// sendMessage('updateDemo', {id: recordingId, recording: { uuid: recordingId, updated_timestamp, alterations }})
	
}

export const loadModifications = () => {
	const modifications: DOMModifcationsType = JSON.parse(
		localStorage.getItem(MOCKSI_MODIFICATIONS) || "{}",
	);
	for (const modification of Object.entries(modifications)) {
		// value here is encoded, SHOULD NOT be a security risk to put it in the innerHTML
		const [querySelector, { nextText }] = modification;
		const hasIndex = querySelector.match(/\[[0-9]+\]/);
		if (hasIndex) {
			const index: number = +hasIndex[0].replace("[", "").replace("]", "");
			const elemToModify = document.querySelectorAll(
				querySelector.replace(hasIndex[0], ""),
			)[index];
			//@ts-ignore
			elemToModify.innerHTML = nextText;
		} else {
			const [elemToModify] = document.querySelectorAll(querySelector);
			//@ts-ignore
			elemToModify.innerHTML = nextText;
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
