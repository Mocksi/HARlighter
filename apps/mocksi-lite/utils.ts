import { COOKIE_NAME, MOCKSI_RECORDING_STATE, RecordingState } from "./consts";

export const setRootPosition = (state: RecordingState) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
    const bottom = state === RecordingState.READY || state === RecordingState.CREATE;
      extensionRoot.className =
			bottom ? "bottom-extension" : "top-extension";
	}
};

export const logout = () => {
	document.cookie = `${COOKIE_NAME}=`;
	localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.UNAUTHORIZED);
};
