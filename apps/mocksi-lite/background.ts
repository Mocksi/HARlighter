import { ChromeMessageNames } from "./content/constants";

interface ChromeMessage {
	message: string;
	status?: string;
	tabId?: string;
}

interface ChromeMessageWithData extends ChromeMessage {
	data: string;
}

chrome.action.onClicked.addListener((tab) => {
	chrome.cookies.get(
		{ url: "https://mocksi-auth.onrender.com/", name: "sessionid" },
		(cookie) => {
			chrome.tabs.sendMessage(tab.id || 0, {
				text: "clickedIcon",
				loginToken: cookie?.value || "",
			});
		},
	);
});

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function sendData(request: Map<string, any>) {
	const data = {
		request: request.get("request"),
		response: request.get("response"),
		response_body: request.get("response_body"),
		cookies: request.get("cookies"),
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

	if (message === "Network.responseReceived") {
		if (params.response) {
			const request = requests.get(params.requestId);
			if (request === undefined) {
				console.log(params.requestId, "#not found request");
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
			console.log(params.requestId, "#not found request");
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
			return true; // Indicate that the response is sent asynchronously
		}
		// FIXME: this is probably not needed anymore
		if (request.message === "getCurrentTabId") {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (tabs.length === 0) {
					console.error("No active tabs found");
					sendResponse({
						message: request.message,
						status: "error",
						tabId: undefined,
					});
					return;
				}
				const currentTab = tabs[0];
				console.log("Current tab:", currentTab.id);
				if (currentTab.id === undefined) {
					console.error("Current tab ID is undefined");
					sendResponse({
						message: request.message,
						status: "error",
						tabId: undefined,
					});
					return;
				}
				const tabId = currentTab.id;
				chrome.scripting.executeScript({
					target: { tabId },
					func: () => {
						console.log("added yellow background");
					},
				});
				sendResponse({
					message: request.message,
					status: "ok",
					tabId: tabId.toString(),
				});
			});
			return true; // Indicate that the response is sent asynchronously
		}

		if (request.message === ChromeMessageNames.SEND_RECORDING_PACKET) {
			webSocket?.send(request.data);
			sendResponse({ message: request.message, status: "ok" });
			return true; // Indicate that the response is sent asynchronously
		}
		return false; // No async response for other messages
	},
);

console.log("background script loaded");

const wsUrl = "ws://localhost:8090/ws";
const webSocket = new WebSocket(wsUrl);

webSocket.onopen = () => {
	keepAlive();
};

webSocket.onmessage = (event) => {
	console.log(`websocket received message: ${event.data}`);
};

webSocket.onclose = () => {
	console.log("websocket connection closed");
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
