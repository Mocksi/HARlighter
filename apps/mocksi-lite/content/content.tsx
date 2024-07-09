import ReactDOM from "react-dom/client";
import {
	MOCKSI_RECORDING_STATE,
	RecordingState,
	STORAGE_CHANGE_EVENT,
	SignupURL,
} from "../consts";
import {
	getAlterations,
	getEmail,
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		if (root) {
			root.unmount();
		}
		root = ReactDOM.createRoot(extensionRoot);
		getEmail().then((email) => {
			chrome.storage.local.get([MOCKSI_RECORDING_STATE], (results) => {
				const recordingState: RecordingState | null =
					results[MOCKSI_RECORDING_STATE];
				let state = recordingState;
				
				console.log({ recordingState });

				if (email && !recordingState) {
					// we need to initialize recordingState if there's none.
					chrome.storage.local.set({
						[MOCKSI_RECORDING_STATE]: RecordingState.READY,
					});
					state = RecordingState.READY;
				}

				if (recordingState === RecordingState.PLAY) {
					sendMessage("updateToPlayIcon");
				}

				if (
					recordingState === RecordingState.UNAUTHORIZED &&
					window.location.origin !== SignupURL
				) {
					window.open(SignupURL);
				}

				setRootPosition(state);

				root.render(
					<ContentApp
						isOpen={true}
						email={email || ""}
					/>,
				);
			});
		});
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
