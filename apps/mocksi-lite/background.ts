import MocksiRollbar from "./MocksiRollbar";
import { MOCKSI_RECORDING_STATE, STORAGE_KEY, SignupURL } from "./consts";
import { AppState } from "./content/AppStateContext";
import { initializeMckSocket, sendMckSocketMessage } from "./mckSocket";
import { apiCall } from "./networking";
import { getEmail, getLastPageDom } from "./utils";

export interface Alteration {
	selector: string;
	action: string;
	dom_before: string;
	dom_after: string;
	type: string;
}

export interface Recording {
	updated_timestamp: Date;
	alterations: Alteration[];
	creator: string;
	customer_name: string;
	demo_name: string;
	dom_before: string;
	tab_id: string;
	uuid: string;
	url: string;
}

interface ChromeMessage {
	message: string;
	status?: string;
	tabId?: string;
	body?: Record<string, unknown>;
	detail?: string;
}

interface RequestInterception {
	type: string;
	url: string;
	method: string;
	payload: string;
}

interface ChatResponse {
	type: "ChatResponse";
	chat_message: string;
}

interface ChromeMessageWithData extends ChromeMessage {
	data: string;
}

const CHAT_UPDATED_EVENT = "chatUpdated";

addEventListener("install", () => {
	// TODO test if this works on other browsers
	chrome.tabs.create({
		url: SignupURL,
	});
});

chrome.action.onClicked.addListener((activeTab) => {
	const { id: currentTabId } = activeTab;

	if (currentTabId && currentTabId < 0) {
		return;
	}

	let activeTabUrl = "";
	try {
		activeTabUrl = activeTab?.url || "";
	} catch (e) {
		console.log("Error getting active tab url", e);
		activeTabUrl = "";
	}

	if (activeTabUrl === "" || activeTabUrl.startsWith("chrome://")) {
		chrome.action.disable();
		return;
	}

	if (!chrome.action.isEnabled()) {
		chrome.action.enable();
	}

	chrome.tabs.sendMessage(currentTabId || 0, {
		text: "clickedIcon",
	});
});

interface DataPayload {
	request: string;
	response: string;
	response_body: string;
	cookies: string;
	currentTabId?: string;
	tabMetadata?: chrome.tabs.Tab;
	sessionID?: string;
	currentURL?: string;
}

let currentTabId: number | undefined;
const requestInterceptions: Map<string, RequestInterception> = new Map();

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function sendData(request: Map<string, any>) {
	if (!currentTabId) {
		return;
	}

	let tabMetadata: chrome.tabs.Tab | undefined = undefined;
	let sessionID: string | undefined = undefined;
	chrome.tabs.get(currentTabId, (tab) => {
		tabMetadata = tab as chrome.tabs.Tab;
		sessionID = tab.sessionId;
		currentTabId = tab.id;
		const data: DataPayload = {
			request: request.get("request"),
			response: request.get("response"),
			response_body: request.get("response_body"),
			cookies: request.get("cookies"),
			currentTabId: currentTabId?.toString() || "0",
		};

		if (tabMetadata) {
			data.tabMetadata = tabMetadata;
			data.sessionID = sessionID;
		}

		sendMckSocketMessage(data);
	});
}

export function handleMckSocketMessage(data: string) {
	let command: RequestInterception | ChatResponse | null = null;
	try {
		const decodedBase64 = atob(data);
		const decodedURL = decodeURIComponent(decodedBase64);
		const parsed = JSON.parse(decodedURL);
		command = parsed as RequestInterception | ChatResponse;
	} catch (e) {
		console.error("Error parsing MckSocket message", e);
		return;
	}

	if (command?.type === "RequestInterception") {
		const interceptDataEncoded = atob(command.payload);
		const interceptData = decodeURIComponent(interceptDataEncoded);
		const interception: RequestInterception = {
			type: command.type,
			url: command.url,
			method: command.method,
			payload: interceptData,
		};
		requestInterceptions.set(command.url, interception);
		console.log("Will intercept request", command.url);

		if (!currentTabId) {
			return;
		}

		chrome.debugger.sendCommand(
			{ tabId: currentTabId },
			"Network.setRequestInterception",
			{
				patterns: [
					{
						urlPattern: command.url,
						resourceType: "XHR",
						interceptionStage: "HeadersReceived",
					},
				],
			},
			(response) => {
				console.log("requested", response);
			},
		);
		chrome.debugger.onEvent.addListener(allEventHandler);
	}

	if (command?.type === "ChatResponse") {
		handleChatResponse(command as ChatResponse);
	}

	if (command?.type === "beginChat") {
		console.log("TBD: beginChat");
	}
}

function handleChatResponse(response: ChatResponse) {
	chrome.storage.local.get([STORAGE_KEY], (result) => {
		const messages = result[STORAGE_KEY] ? JSON.parse(result[STORAGE_KEY]) : [];
		const newMessage = {
			role: "assistant",
			content: response.chat_message,
		};
		messages.push(newMessage);

		chrome.storage.local.set(
			{ [STORAGE_KEY]: JSON.stringify(messages) },
			() => {
				if (chrome.runtime.lastError) {
					console.error("Error saving chat message:", chrome.runtime.lastError);
				} else {
					console.log("Chat message saved successfully");
					chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
						if (tabs[0]?.id) {
							chrome.tabs.sendMessage(tabs[0].id, { type: CHAT_UPDATED_EVENT });
						}
					});
				}
			},
		);
	});
}

function onAttach(tabId: number) {
	chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable");
	chrome.debugger.onEvent.addListener(allEventHandler);
}

function debuggerDetachHandler() {
	requests.clear();
}

async function attachDebugger() {
	console.log("attaching");
	const version = "1.0";

	const [activeTab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});

	if (!activeTab || !activeTab.id) {
		console.error("Cannot find active tab ID to attach debugger");
		return;
	}

	try {
		chrome.debugger.attach(
			{ tabId: activeTab.id },
			version,
			onAttach.bind(null, activeTab.id),
		);
		chrome.debugger.onDetach.addListener(debuggerDetachHandler);
		chrome.tabs.sendMessage(currentTabId || 0, {
			text: "clickedIcon",
		});
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		console.error("Error attaching debugger", e);
		if (e.message === "Cannot access a chrome:// URL") {
			console.log("Cannot attach to this target");
			return;
		}
		MocksiRollbar.error("Error attaching debugger", e);
	}
}

async function detachDebugger() {
	const [activeTab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});

	if (!activeTab || !activeTab.id) {
		console.error("Cannot find active tab ID to detach debugger");
		return;
	}

	try {
		await chrome.debugger.detach({ tabId: activeTab.id });
	} catch (e) {
		console.error("Error detaching debugger", e);
	}
}

async function createDemo(body: Record<string, unknown>) {
	const defaultBody = {
		created_timestamp: new Date(),
		updated_timestamp: new Date(),
	};

	chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([result]) => {
		apiCall("recordings", "PUT", {
			...body,
			...defaultBody,
			tab_id: result.id?.toString() ?? "",
			url: result.url,
		}).then(() => getRecordings());
	});
}

function updateDemo(data: Record<string, unknown>) {
	const { id, recording } = data;
	apiCall(`recordings/${id}`, "POST", recording).then(() => getRecordings());
}

async function deleteDemo(data: Record<string, unknown>) {
	const { id } = data;
	apiCall(`recordings/${id}`, "DELETE").then(() => getRecordings());
}

async function getRecordings() {
	const email = await getEmail();

	if (email) {
		const response = await apiCall(
			`recordings?creator=${encodeURIComponent(email)}`,
		).catch((err) => {
			console.error(`Failed to fetch recordings: ${err}`);
			return null;
		});
		if (!response || response.length === 0) {
			console.error("No recordings found or failed to fetch recordings.");
			chrome.storage.local.set({ recordings: "[]" });
			return;
		}
		const sorted = response.sort((a: Recording, b: Recording) =>
			a.updated_timestamp > b.updated_timestamp ? -1 : 0,
		);
		const recordings = JSON.stringify(sorted) || "[]";
		chrome.storage.local.set({ recordings });
	} else {
		console.error("Email not found. Cannot fetch recordings.");
	}
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const requests = new Map<string, Map<string, any>>();

function allEventHandler(
	debuggeeId: chrome.debugger.Debuggee,
	message: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	params: any,
) {
	if (currentTabId !== debuggeeId.tabId) {
		return;
	}

	if (message === "Network.requestWillBeSent") {
		if (params.request) {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const detail = new Map<string, any>();
			detail.set("request", params.request);
			requests.set(params.requestId, detail);
		}
	}

	if (message === "Network.requestIntercepted") {
		console.log("requestIntercepted params", params);
		const url = params.request.url;
		console.log("requestWillBeSent", url);
		if (requestInterceptions.has(url)) {
			console.log("intercepting request", url);
			const interception = requestInterceptions.get(url);
			if (interception && params.request.method === interception.method) {
				chrome.debugger.sendCommand(
					{
						tabId: debuggeeId.tabId,
					},
					"Network.continueInterceptedRequest",
					{
						interceptionId: params.interceptionId,
						rawResponse: btoa(interception.payload),
					},
					(response) => {
						console.log("intercepted request", response);
					},
				);
			}
		}
	}

	if (message === "Network.responseReceived") {
		if (params.response) {
			const request = requests.get(params.requestId);
			if (request === undefined) {
				console.log("couldn't find request: ", params.requestId);
				return;
			}
			request.set("response", params.response);
			chrome.debugger.sendCommand(
				{
					tabId: debuggeeId.tabId,
				},
				"Network.getCookies",
				{
					urls: [params.response.url],
				},
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				(response: any) => {
					if (response?.cookies) {
						request.set("cookies", response.cookies);
					}
				},
			);
			requests.set(params.requestId, request);
		}
	}

	if (message === "Network.loadingFinished") {
		const request = requests.get(params.requestId);
		if (request === undefined) {
			console.log(
				params.requestId,
				"couldn't find request for loadingFinished: ",
				params.requestId,
			);
			return;
		}

		chrome.debugger.sendCommand(
			{
				tabId: debuggeeId.tabId,
			},
			"Network.getResponseBody",
			{
				requestId: params.requestId,
			},
			(response) => {
				if (response) {
					request.set("response_body", response);
					requests.set(params.requestId, request);
					sendData(request);
					requests.delete(params.requestId);
				} else {
					console.log("empty");
				}
			},
		);
	}
}

const setPlayMode = async (url?: string) => {
	const [result] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true,
	});
	await chrome.tabs.create({ url });
	await chrome.action.setIcon({ path: "./public/pause-icon.png" });
	await chrome.storage.local.set({
		[MOCKSI_RECORDING_STATE]: AppState.PLAY,
	});
};

const handleRequestChat = async (message: string) => {
	try {
		const lastPageDom = await getLastPageDom();
		const json_data = {
			messageBody: {
				messages: JSON.parse(message),
				lastPageDom,
			},
		};
		const payload = {
			command: "requestChatTest",
			type: "requestChatTest",
			json_data: {
				message: JSON.stringify({
					type: "requestChat",
					json_data: json_data,
					user_id: "user123",
					session_id: "session456",
					event_timestamp: new Date().toISOString(),
				}),
			},
		};
		sendMckSocketMessage(payload);
	} catch (error) {
		console.error("Error handling requestChat:", error);
	}
};

chrome.runtime.onMessage.addListener(
	(
		request: ChromeMessageWithData,
		sender: chrome.runtime.MessageSender,
		sendResponse: (response: ChromeMessage) => void,
	): boolean => {
		console.log("Received message:", request);

		if (request.message === "createDemo") {
			if (!request.body) {
				return false;
			}
			createDemo(request.body);
			return true;
		}

		if (request.message === "updateDemo") {
			if (!request.body) {
				return false;
			}
			updateDemo(request.body);
			return true;
		}

		if (request.message === "deleteDemo") {
			if (!request.body) {
				return false;
			}
			deleteDemo(request.body);
			return true;
		}

		if (request.message === "getRecordings") {
			getRecordings();
			return true;
		}

		if (request.message === "updateToPauseIcon") {
			chrome.action.setIcon({ path: "./public/pause-icon.png" });
			return true;
		}

		if (request.message === "updateToPlayIcon") {
			chrome.action.setIcon({ path: "./public/play-icon.png" });
			return true;
		}

		if (request.message === "resetIcon") {
			chrome.action.setIcon({ path: "./public/mocksi-icon.png" });
			return true;
		}

		if (request.message === "attachDebugger") {
			attachDebugger();
			return true;
		}

		if (request.message === "detachDebugger") {
			detachDebugger();
			return true;
		}

		if (request.message === "Chat") {
			return true;
		}

		if (
			request.message === "requestChat" ||
			request.message === "requestChatTest"
		) {
			try {
				console.log("Requesting chat with message:", request.body);
				const body = JSON.stringify(request.body) || "";
				handleRequestChat(body);
			} catch (error) {
				console.log("Error handling requestChat:", error);
			}

			return true;
		}

		if (request.message === "ChatResponse") {
			if (
				request.body &&
				typeof request.body === "object" &&
				"chat_message" in request.body
			) {
				handleChatResponse(request.body as unknown as ChatResponse);
				sendResponse({ message: request.message, status: "success" });
			} else {
				sendResponse({
					message: request.message,
					status: "error",
					detail: "Invalid ChatResponse body",
				});
			}
			return true;
		}

		sendResponse({ message: request.message, status: "fail" });
		return false; // No async response for other messages
	},
);

initializeMckSocket();
