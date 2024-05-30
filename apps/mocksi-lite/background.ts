import {COOKIE_NAME} from "./consts";
import { WebSocketURL } from "./content/constants";

interface ChromeMessage {
	message: string;
	status?: string;
	tabId?: string;
}

interface ChromeMessageWithData extends ChromeMessage {
	data: string;
}

addEventListener("install", () => {
	// TODO test if this works on other browsers
	// TODO2 Read from environment variable the correct URL to redirect after install
	chrome.tabs.create({
		url: "https://mocksi-auth.onrender.com/",
	});
});

// To Remove since the action.onClicked has been overwrited 
let loginToken = "";

// TODO: create a type for the request
// biome-ignore lint/suspicious/noExplicitAny: this is hard to type
function sendData(request: Map<string, any>) {
	const data = {
		request: request.get("request"),
		response: request.get("response"),
		response_body: request.get("response_body"),
		cookies: request.get("cookies"),
		currentTabId: currentTabId?.toString() || "0",
		loginToken,
	};
	webSocket?.send(btoa(JSON.stringify(data)));
}

function onAttach(tabId: number) {
	chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable");
	chrome.debugger.onEvent.addListener(allEventHandler);
}

function debuggerDetachHandler() {
	console.log("detach");
	requests.clear();
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
		if (request.message === "tabSelected") {
			console.log("Received tabSelected message:", request);
			if (currentTabId) {
				chrome.debugger.detach({ tabId: currentTabId });
			}
			if (request.tabId !== undefined) {
				currentTabId = Number.parseInt(request.tabId, 10);
			}

			if (currentTabId && currentTabId < 0) {
				return false;
			}
			console.log("Attaching debugger to tab:", currentTabId);
			const version = "1.0";
			if (currentTabId) {
				chrome.debugger.attach(
					{ tabId: currentTabId },
					version,
					onAttach.bind(null, currentTabId),
				);
				chrome.debugger.onDetach.addListener(debuggerDetachHandler);
			}

			sendResponse({ message: request.message, status: "success" });
			chrome.cookies.get(
				{ url: "https://mocksi-auth.onrender.com/", name: COOKIE_NAME },
				(cookie) => {
					// TODO: this is insecure AF, but good enough for now
					loginToken = cookie?.value || "";
					chrome.tabs.sendMessage(currentTabId || 0, {
						text: "clickedIcon",
						loginToken,
					});
					
				},
			);
			return true; // Indicate that the response is sent asynchronously
		}

		sendResponse({ message: request.message, status: "fail" });
		return false; // No async response for other messages
	},
);

console.log("background script loaded 1");

let webSocket = new WebSocket(WebSocketURL);

webSocket.onopen = () => {
	keepAlive();
};

webSocket.onmessage = (event) => {
	console.log(`websocket received message: ${event.data}`);
};

webSocket.onclose = () => {
	console.log("websocket connection closed");
	const reconnectInterval = 5000; // 5 seconds
	let reconnectTimeout = 10000;

	function reconnectWebSocket() {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}
		reconnectTimeout = setTimeout(() => {
			console.log("Reconnecting websocket...");
			webSocket = new WebSocket(WebSocketURL);
			webSocket.onopen = () => {
				console.log("Websocket reconnected");
				keepAlive();
			};
			webSocket.onmessage = (event) => {
				console.log(`Websocket received message: ${event.data}`);
			};
			webSocket.onclose = () => {
				reconnectWebSocket();
			};
		}, reconnectInterval);
	}

	reconnectWebSocket();
};

function disconnect() {
	if (webSocket == null) {
		return;
	}
	webSocket.close();
}

function keepAlive() {
	const keepAliveIntervalId = setInterval(() => {
		if (webSocket) {
			webSocket.send("keepalive");
		} else {
			clearInterval(keepAliveIntervalId);
		}
	}, 20 * 1000);
}
