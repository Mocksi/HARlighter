import ReactDOM from "react-dom/client";
import {
	MOCKSI_RECORDING_STATE,
	RecordingState,
	STORAGE_CHANGE_EVENT,
	SignupURL,
} from "../consts";
import {
  getAlterations,
  getEmail, getRecordingsStorage,
  loadAlterations,
  sendMessage,
  setRootPosition,
} from "../utils";
import ContentApp from "./ContentApp";

let root: ReactDOM.Root;
async function handlePlayState() {
	const alterations = await getAlterations();
	if (alterations?.length) {
		loadAlterations(alterations, false);
	}
}

function initial() {
	const rootDiv =
		document.getElementById("extension-root") || document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);

	chrome.storage.local.get([MOCKSI_RECORDING_STATE], (results) => {
		const recordingState: RecordingState | null =
			results[MOCKSI_RECORDING_STATE];
		if (recordingState === RecordingState.HIDDEN) {
			handlePlayState();
		}
	});
}

document.addEventListener("DOMContentLoaded", initial);

async function handleRecordingState(): Promise<{ state: RecordingState, email: string|null }> {
  const email = await getEmail();
  const results = await chrome.storage.local.get([MOCKSI_RECORDING_STATE]);
  const recordings = await getRecordingsStorage();

  const recordingState = results[MOCKSI_RECORDING_STATE];
  let state = recordingState;
  console.log({recordingState})

  if (email) {
    // USER IS LOGGED IN
    switch (recordingState) {
      case RecordingState.UNAUTHORIZED:
      case RecordingState.READY:
      case undefined:
        const nextState = recordings.length ? RecordingState.CREATE : RecordingState.READY;
        await chrome.storage.local.set({
          [MOCKSI_RECORDING_STATE]: nextState,
        });
        state = nextState;
        break;
      case RecordingState.EDITING:
        await chrome.storage.local.set({
          [MOCKSI_RECORDING_STATE]: RecordingState.CREATE,
        });
        state = RecordingState.CREATE;
        break;
      case RecordingState.PLAY:
        sendMessage("updateToPlayIcon");
        break;
    }
  } else {
    // USER IS NOT LOGGED IN
    if (
      recordingState === RecordingState.UNAUTHORIZED &&
      window.location.origin !== SignupURL
    ) {
      window.open(SignupURL);
    }
    sendMessage("resetIcon")
    state = RecordingState.UNAUTHORIZED;
  }

  return {state, email};
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		if (root) {
			root.unmount();
		}
		root = ReactDOM.createRoot(extensionRoot);
    handleRecordingState().then(({state, email}) => {
      setRootPosition(state);

      root.render(
        <ContentApp
          initialState={state}
          isOpen={true}
          email={email || ""}
        />,
      );
    })

	}
	sendResponse({ status: "success" });
});

// LocalStorageChangeEventData defines the structure for local storage change events.
interface LocalStorageChangeEventData {
	type: string;
	key: string;
	value: string;
}

// Listen for custom events from the web page
window.addEventListener("message", (event: MessageEvent) => {
	const eventData = event.data as LocalStorageChangeEventData;

	if (event.source !== window || !eventData || !eventData.type) {
		return;
	}

	console.log("Content script received message: ", eventData);
	if (eventData.type.toUpperCase() === STORAGE_CHANGE_EVENT.toUpperCase()) {
		chrome.storage.local.set({ [eventData.key]: eventData.value }).then(() => {
			console.log(eventData.key, " set.");
		});
	}
});
