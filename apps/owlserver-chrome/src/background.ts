import { v4 as uuidv4 } from "uuid";

interface ChromeMessage {
	message: string;
	status?: string;
}

interface ChromeMessageWithData extends ChromeMessage {
	data: string;
}

// TODO: introduce a Recorder class to handle recording state, data, and sending data to the server
const buffer: string[] = [];
let recordingState = true;
let sessionId = "";
let tabSessionId = "";

// TODO:: make this neater
chrome.storage.local.get("recordingState", (result) => {
	recordingState = result.recordingState || false;
});

chrome.runtime.onMessage.addListener(
	(
		request: ChromeMessageWithData,
		sender: chrome.runtime.MessageSender,
		sendResponse: (response: ChromeMessage) => void,
	): void => {
		if (recordingState && request.message === "wrapperToBackground") {
			if (request.data.length > 0) {
				buffer.push(request.data);
			}
			sendResponse({ message: "backgroundToPopup", status: "ok" });
			return;
		}

		if (
			request.message === "startRecording" ||
			request.message === "stopRecording"
		) {
			recordingState = request.message === "startRecording";
			chrome.storage.local.set({ recordingState });
			sendResponse({ message: request.message, status: "success" });
			return;
		}

		if (request.message === "startRecording") {
			sessionId = uuidv4();
		}

		if (request.message === "stopRecording") {
			sessionId = "";
		}

		sendResponse({ message: request.message, status: "pending" });
	},
);

interface WebsocketPayload {
	dataType: string;
	data: string;
	timestamp: number;
	sessionId?: string;
	tabSessionId?: string;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab: chrome.tabs.Tab) => {
	if (changeInfo.status === "complete") {
		const dataUnencoded = {
			tabId,
			url: tab.url,
			title: tab.title,
			pendingUrl: tab.pendingUrl,
			sessionId: tab.sessionId,
		};
		const data = btoa(JSON.stringify(dataUnencoded));

		const payload: WebsocketPayload = {
			dataType: "tab_data",
			data: data,
			timestamp: nowTimestampB(),
		};
		if (sessionId) {
			payload.sessionId = sessionId;
		}
		if (tab.sessionId) {
			tabSessionId = tab.sessionId;
			payload.tabSessionId = tabSessionId;
		}
		if (recordingState && webSocket) {
			webSocket.send(JSON.stringify(payload));
		}
	}
});

let webSocket: WebSocket | null = null;
try {
	webSocket = new WebSocket("ws://localhost:8080/ws");
} catch (error) {
	console.error("websocket connection failed");
}

if (!webSocket) {
	console.error("websocket connection failed");
}

webSocket.onopen = (event) => {
	keepAlive();
};

webSocket.onmessage = (event) => {
	console.log(`websocket received message: ${event.data}`);
};

webSocket.onclose = (event) => {
	console.log("websocket connection closed");
	webSocket = null;
};

function disconnect() {
	if (webSocket == null) {
		return;
	}
	webSocket.close();
}

function keepAlive() {
	const keepAliveIntervalId = setInterval(
		() => {
			if (webSocket) {
				webSocket.send("keepalive");
			} else {
				clearInterval(keepAliveIntervalId);
			}
		},
		// Set the interval to 20 seconds to prevent the service worker from becoming inactive.
		20 * 1000,
	);
}

// FIXME: this is duplicated in wrappers.ts
function nowTimestampB(): number {
	return Math.floor(Date.now() / 1000);
}

function sendDataToServer(): void {
	if (buffer.length < 1) {
		return;
	}
	buffer.map((data) => {
		const payload: WebsocketPayload = {
			dataType: "bData",
			data,
			timestamp: nowTimestampB(),
		};
		if (sessionId) {
			payload.sessionId = sessionId;
		}
		console.log(`sending data to server: ${data}`);
		webSocket.send(JSON.stringify(payload));
	});

	buffer.length = 0; // Clear the buffer after sending the data
}

// send data every 2 seconds
setInterval(sendDataToServer, 2000);
