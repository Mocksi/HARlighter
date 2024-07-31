import ReactDOM from "react-dom/client";
import type { Recording } from "../background";
import {
	MOCKSI_AUTH,
	MOCKSI_READONLY_STATE,
	MOCKSI_RECORDING_STATE,
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
import { AppState } from "./AppStateContext";
import ContentApp from "./ContentApp";
import { setEditorMode } from "./EditMode/editMode";

let root: ReactDOM.Root;
async function handlePlayState() {
	const alterations = await getAlterations();

	if (alterations?.length) {
		loadAlterations(alterations, false);
	}
}

async function handleEditState() {
	const alterations = await getAlterations();

	if (alterations?.length) {
		loadAlterations(alterations, true);
	}

	setEditorMode(true);
}

function initial() {
	const rootDiv =
		document.getElementById("extension-root") || document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);

	chrome.storage.local.get([MOCKSI_RECORDING_STATE], (results) => {
		const appState: AppState | null = results[MOCKSI_RECORDING_STATE];
		if (appState === AppState.PLAY) {
			handlePlayState();
		}

		if (appState === AppState.EDITING) {
			handleEditState();
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
			chrome.storage.local.get(
				[MOCKSI_RECORDING_STATE, MOCKSI_READONLY_STATE],
				(results) => {
					const appState: AppState | null = results[MOCKSI_RECORDING_STATE];
					let state = appState;

					console.log({ appState });

					if (email && !appState) {
						// we need to initialize app state if there's none.
						chrome.storage.local.set({
							[MOCKSI_RECORDING_STATE]: AppState.LIST,
						});
						state = AppState.LIST;
					}

					if (appState === AppState.PLAY) {
						sendMessage("updateToPlayIcon");
					}

					if (
						(appState === AppState.UNAUTHORIZED || !email) &&
						window.location.origin !== SignupURL
					) {
						chrome.storage.local.set({
							[MOCKSI_RECORDING_STATE]: AppState.UNAUTHORIZED,
						});
						state = AppState.UNAUTHORIZED;

						window.open(SignupURL);
					}

					setRootPosition(state);

					sendMessage("getRecordings", {}, (response) => {
						const { body } = response;
						const { recordings } = body as { recordings: Recording[] };

						root.render(
							<ContentApp
								isOpen={true}
								email={email || ""}
								initialState={{
									recordings,
									readOnly: results[MOCKSI_READONLY_STATE],
								}}
							/>,
						);
					});
				},
			);
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

		if (eventData.key === MOCKSI_AUTH) {
			chrome.storage.local.get([MOCKSI_RECORDING_STATE], (results) => {
				const appState: AppState | null = results[MOCKSI_RECORDING_STATE];
				if (appState === AppState.UNAUTHORIZED) {
					chrome.storage.local.set({
						[MOCKSI_RECORDING_STATE]: AppState.LIST,
					});
				}
			});
		}
	}
});
