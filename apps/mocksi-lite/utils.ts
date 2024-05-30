import { COOKIE_NAME, MOCKSI_RECORDING_STATE, RecordingState } from "./consts";

export const setRootPosition = (state: RecordingState) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		extensionRoot.className =
			state === RecordingState.READY ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	document.cookie = `${COOKIE_NAME}=`;
	localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.UNAUTHORIZED);
};
