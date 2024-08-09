import { WebSocketURL } from "./consts";
import { Storage } from './content/Storage'

let mckSocket: WebSocket;

interface WebsocketResponse {
	detail: string;
	status: string;
	type: string;
	chat_message?: string;
}

export function initializeMckSocket() {
	mckSocket = new WebSocket(WebSocketURL);

	mckSocket.onopen = () => {
		console.log("MckSocket connection opened");
		keepAlive();
	};

	mckSocket.onmessage = (event) => {
		console.log(`MckSocket received message: ${event.data}`);
		handleMckSocketMessage(event.data);
	};

	mckSocket.onclose = () => {
		console.log("MckSocket connection closed");
		reconnectMckSocket();
	};
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function sendMckSocketMessage(message: any) {
	if (mckSocket && mckSocket.readyState === WebSocket.OPEN) {
		const jsonString = JSON.stringify(message);
		const urlEncoded = encodeURIComponent(jsonString);
		const base64Encoded = btoa(urlEncoded);
		mckSocket.send(base64Encoded);
	} else {
		console.error("MckSocket is not open. Unable to send message.");
	}
}

function reconnectMckSocket() {
	const reconnectInterval = 5000; // 5 seconds

	setTimeout(() => {
		console.log("Reconnecting MckSocket...");
		initializeMckSocket();
	}, reconnectInterval);
}

function handleMckSocketMessage(data: string) {
	try {
		console.log("Raw WebSocket message:", data);

		// Step 1: Decode Base64
		const decodedBase64 = atob(data);
		console.log("Decoded Base64 message:", decodedBase64);

		// Step 2: Decode URL encoding
		const decodedURL = decodeURIComponent(decodedBase64);
		console.log("Decoded URL message:", decodedURL);

		// Step 3: Parse JSON
		const parsedData: WebsocketResponse = JSON.parse(decodedURL);
		console.log("Parsed WebSocket message:", parsedData);

		switch (parsedData.type) {
			case "ChatResponse":
				handleChatResponse(parsedData);
				break;
			case "RequestInterception":
				handleRequestInterception(parsedData);
				break;
			default:
				console.log("MCKReceived message:", parsedData.detail);
		}
	} catch (error) {
		console.error("Error handling WebSocket message:", error);
		console.error("Raw message that caused the error:", data);
	}
}
function ensureAscii(input: string): string {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
	return input.replace(/[^\x00-\x7F]/g, " ");
}

function removeAllPercent(input: string): string {
	return input.replace(/%20/g, " ");
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function appendMessageToStorage(message: any) {
	const result = await Storage.getItem(["reply_messages"])

	const messages = result.reply_messages || [];
	messages.push(message);
	await Storage.setItem({ reply_messages: messages })
	console.log("Message appended to storage");
}

function handleChatResponse(response: WebsocketResponse) {
	if (!response.chat_message) {
		console.error("ChatResponse does not contain chat_message");
		return;
	}
	const withSpaces = ensureAscii(removeAllPercent(response.chat_message));
	const output = decodeURIComponent(withSpaces);
	const newMessage = {
		role: "assistant",
		content: output,
	};
	appendMessageToStorage(newMessage);
}

function handleRequestInterception(response: WebsocketResponse) {
	if (response.detail) {
		try {
			const interceptionData = JSON.parse(response.detail);
			console.log("Received request interception:", interceptionData);
			// Handle the request interception data
		} catch (error) {
			console.error("Error parsing request interception data:", error);
		}
	}
}

// biome-ignore lint/suspicious/noExplicitAny: thanks to node.js this is pretty painful to type
let keepAliveIntervalId: any;

function keepAlive() {
	if (keepAliveIntervalId !== null) {
		clearInterval(keepAliveIntervalId);
	}

	keepAliveIntervalId = setInterval(
		() => {
			if (!mckSocket) {
				if (keepAliveIntervalId) {
					clearInterval(keepAliveIntervalId);
				}
				return;
			}
			try {
				sendMckSocketMessage("keepalive");
			} catch (e) {
				console.error("Error sending keepalive", e);
			}
		},
		20 * 60 * 1000,
	); // Set to 20 minutes
}
