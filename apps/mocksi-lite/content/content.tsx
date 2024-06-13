import ReactDOM from "react-dom/client";
import { STORAGE_CHANGE_EVENT, STORAGE_KEY } from "../consts";
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
		chrome.storage.local.get(STORAGE_KEY).then((value) => {
			const { email } = JSON.parse(value[STORAGE_KEY] || {});
			if (email) {
				// we need to initialize recordingState if there's none.
				!localStorage.getItem('mocksi-recordingState') && localStorage.setItem('mocksi-recordingState', 'READY')
				root.render(<ContentApp isOpen={true} email={email || ""} />);
			}
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
		chrome.runtime.sendMessage({ message: "AuthEvent" });
	}
});

console.log("Content script loaded.");
