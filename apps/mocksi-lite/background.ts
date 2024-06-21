import MocksiRollbar from "./MocksiRollbar";
import { STORAGE_KEY, SignupURL, WebSocketURL } from "./consts";
import { apiCall } from "./networking";
import { getEmail, logout } from "./utils";

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
}

interface RequestInterception {
	type: string;
	url: string;
	method: string;
	payload: string;
}

interface ChromeMessageWithData extends ChromeMessage {
	data: string;
}

const requestInterceptions: Map<string, RequestInterception> = new Map();
addEventListener("install", () => {
	// TODO test if this works on other browsers
	chrome.tabs.create({
		url: SignupURL,
	});
});

chrome.action.onClicked.addListener((activeTab) => {
	let { id: currentTabId } = activeTab;
	if (currentTabId) {
		try {
			chrome.debugger.detach({ tabId: currentTabId });
		} catch (e) {
			currentTabId = -1;
		}
	}

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

	const version = "1.0";
	if (!currentTabId) {
		return;
	}

	try {
		chrome.debugger.attach(
			{ tabId: currentTabId },
			version,
			onAttach.bind(null, currentTabId),
		);
		chrome.debugger.onDetach.addListener(debuggerDetachHandler);
		chrome.tabs.sendMessage(currentTabId || 0, {
			text: "clickedIcon",
		});
		// biome-ignore lint/suspicious/noExplicitAny: error message
	} catch (e: any) {
		console.error("Error attaching debugger", e);
		if (e.message === "Cannot access a chrome:// URL") {
			console.log("Cannot attach to this target");
			return;
		}
		MocksiRollbar.error("Error attaching debugger", e);
	}
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

const credsJson = "";

// TODO: create a type for the request
// biome-ignore lint/suspicious/noExplicitAny: this is hard to type
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

		// uri encode the data before sending to prevent
		// problems with unicode data
		const dataStr = JSON.stringify(data);
		const encodedDataStr = encodeURIComponent(dataStr);
		webSocket?.send(btoa(encodedDataStr));
	});
}

function onAttach(tabId: number) {
	chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable");
	chrome.debugger.onEvent.addListener(allEventHandler);
}

function debuggerDetachHandler() {
	requests.clear();
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

async function getRecordings() {
	const email = await getEmail();

	if (email) {
		const response = await apiCall(`recordings?creator=${email}`).catch(
			(err) => {
				console.error(`Failed to fetch recordings: ${err}`);
				return null;
			},
		);
		if (!response || response.length === 0) {
			console.error("No recordings found or failed to fetch recordings.");
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

// TODO: create a type for the params
// biome-ignore lint/suspicious/noExplicitAny: also hard to type
const requests = new Map<string, Map<string, any>>();

function allEventHandler(
	debuggeeId: chrome.debugger.Debuggee,
	message: string,
	// TODO: create a type for the params
	// biome-ignore lint/suspicious/noExplicitAny: params is a generic object
	params: any,
) {
	if (currentTabId !== debuggeeId.tabId) {
		return;
	}

	if (message === "Network.requestWillBeSent") {
		if (params.request) {
			// TODO: create a type for the detail
			// biome-ignore lint/suspicious/noExplicitAny: same as above
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
				// biome-ignore lint/suspicious/noExplicitAny: Reading from a generic object
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

let currentTabId: number | undefined;
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

		sendResponse({ message: request.message, status: "fail" });
		return false; // No async response for other messages
	},
);

let webSocket = new WebSocket(WebSocketURL);

webSocket.onopen = () => {
	keepAlive();
};

webSocket.onmessage = (event) => {
	console.log(`websocket received message: ${event.data}`);
	let command: RequestInterception | null = null;
	try {
		const parsed = JSON.parse(event.data);
		command = parsed as RequestInterception;
	} catch (e) {
		console.error("Error parsing websocket message", e);
		return;
	}

	if (command?.type === "RequestInterception") {
		// data will be uri encoded to prevent issues with unicode
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
};

webSocket.onclose = () => {
	console.log("websocket connection closed");
	const reconnectInterval = 5000; // 5 seconds
	// biome-ignore lint/suspicious/noExplicitAny: tried to add NodeJS.Timeout type but is breaking on prod build leaving as any for now.
	let reconnectTimeout: any;

	function reconnectWebSocket() {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}
		reconnectTimeout = setTimeout(() => {
			console.log("Reconnecting websocket...");
			const oldWebSocket = webSocket;
			webSocket = new WebSocket(WebSocketURL);
			// FIXME: this is nasty, but it works
			webSocket.onopen = oldWebSocket.onopen;
			webSocket.onmessage = oldWebSocket.onmessage;
			webSocket.onclose = oldWebSocket.onclose;
		}, reconnectInterval);
	}

	reconnectWebSocket();
};

function keepAlive() {
	const keepAliveIntervalId = setInterval(() => {
		if (!webSocket) {
			clearInterval(keepAliveIntervalId);
		}
		try {
			webSocket.send("keepalive");
		} catch (e) {
			console.error("Error sending keepalive", e);
		}
	}, 5 * 1000);
}
