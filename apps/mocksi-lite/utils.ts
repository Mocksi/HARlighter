import {
	COOKIE_NAME,
	MOCKSI_MODIFICATIONS,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "./consts";
import { Command, SaveModificationCommand, buildQuerySelector } from "./commands/Command";

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
