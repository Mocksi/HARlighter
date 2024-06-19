import ReactDOM from "react-dom/client";
import MocksiRollbar from "../MocksiRollbar";
import {
	MOCKSI_RECORDING_STATE,
	RecordingState,
	STORAGE_CHANGE_EVENT,
	STORAGE_KEY,
	SignupURL,
} from "../consts";
import { setRootPosition } from "../utils";
import ContentApp from "./ContentApp";

let root: ReactDOM.Root;

function initial() {
	const rootDiv =
		document.getElementById("extension-root") || document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);
}

document.addEventListener("DOMContentLoaded", initial);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		if (root) {
			root.unmount();
		}
		root = ReactDOM.createRoot(extensionRoot);

		chrome.storage.local
			.get([STORAGE_KEY, MOCKSI_RECORDING_STATE])
			.then((value) => {
				let parsedData: { email: string } | undefined;
				const storedData = value[STORAGE_KEY] || "{}";
				try {
					parsedData = JSON.parse(storedData);
				} catch (error) {
					console.log("Error parsing data from storage: ", error);
					throw new Error("could not parse data from storage.");
				}

				if (parsedData === undefined || !parsedData.email) {
					throw new Error("No email found in storage.");
				}

				const { email } = parsedData || {};
				const recordingState = value[
					MOCKSI_RECORDING_STATE
				] as RecordingState | null;

				if (email) {
					if (!recordingState) {
						chrome.storage.local.set({
							[MOCKSI_RECORDING_STATE]: RecordingState.READY,
						});
					}
				}

				if (recordingState) {
					setRootPosition(recordingState);
				}

				root.render(<ContentApp isOpen={true} email={email || ""} />);
			})
			.catch((error) => {
				chrome.storage.local.clear();
				console.log("Error getting data from storage: ", error);
				window.open(SignupURL);
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
