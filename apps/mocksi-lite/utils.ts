import {MOCKSI_RECORDING_STATE, RecordingState} from "./consts";

export const setRootPosition = () => {
  const storageState = localStorage.getItem(MOCKSI_RECORDING_STATE);
  const extensionRoot = document.getElementById("extension-root");
  if (extensionRoot) {
    extensionRoot.className = !storageState || storageState === RecordingState.READY ? 'bottom-extension' : 'top-extension';
  }
}

export const logout = () => {
  // document.cookie = `${COOKIE_NAME}=${null}`
  localStorage.removeItem(MOCKSI_RECORDING_STATE);
}
