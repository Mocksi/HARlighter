import type { Header, Request } from "@repo/harlight";
import { v4 as uuidv4 } from "uuid";
import { EventNames } from "./constants";

enum ModeType {
	Record = "record",
	Mock = "mock",
	Original = "original",
}

export enum ActionType {
	Request = "request",
	Response = "response",
	Error = "error",
}

console.log("Setting XHRWrapper");

function currentSessionId(): string {
	const sessionId = localStorage.getItem("sessionId");
	if (sessionId) {
		return sessionId;
	}
	const newSessionId = uuidv4();
	localStorage.setItem("sessionId", newSessionId);
	return newSessionId;
}

function currentUserId(): string {
	const userId = localStorage.getItem("userId");
	if (userId) {
		return userId;
	}
	// TODO: Get this from the login
	const newUserId = "anonymous";
	// FIXME: this should be the id from the login
	localStorage.setItem("userId", newUserId);
	return newUserId;
}

/**
 *
 * @param data Data to send to the background as JSON
 * @param dataType Type of data being sent
 * @returns void
 */
export function sendToBackground(
	json_data: string,
	dataType: ActionType,
): void {
	if (!json_data || !document) {
		return;
	}
	const jsonHolder = document.createElement("script");
	jsonHolder.type = "application/json";
	jsonHolder.id = "jsonHolder";

	const event_timestamp = Date.now();
	const payload = {
		sessionId: currentSessionId,
		userId: currentUserId,
		dataType,
		json_data,
		event_timestamp,
	};
	const parsedPayload = JSON.stringify(payload);
	let b64encoded = "";

	try {
		b64encoded = btoa(parsedPayload) as string;
	} catch (e) {
		console.log(e);
		console.log(`Error encoding ${parsedPayload} to base64`);
		return;
	}

	try {
		jsonHolder.src = b64encoded;
	} catch (e) {
		console.log(e);
		return;
	}
	(document.head || document.documentElement).appendChild(jsonHolder);
	if (document.defaultView) {
		const view = Object.assign({}, document.defaultView);
		const event = new CustomEvent(EventNames.RECORDING_DATA_CAPTURED, {
			detail: view,
		});
		document.dispatchEvent(event);
	} else {
		console.error("Default view is not available");
	}
}

const parseHeaders = (headerString: string): Header[] => {
	const headersDict = Object.fromEntries(
		headerString
			.trim()
			.split("\r\n")
			.map((line) => {
				const [key, ...rest] = line.split(":");
				return [key.trim().toLowerCase(), rest.join(":").trim()];
			}),
	);

	return Object.entries(headersDict).map(([name, value]) => ({ name, value }));
};

class XHRWrapper extends XMLHttpRequest {
	private _mode: ModeType = ModeType.Original;
	private _method = "";
	private _url = "";
	private _requestHeaders: Record<string, string> = {};
	private _postData: Document | BodyInit = "";
	private _startTime = "";

	private parseAndSendCompletedRequest(xhr: XMLHttpRequest): void {
		const headers: Header[] = parseHeaders(xhr.getAllResponseHeaders());
		const request: Request = {
			method: this._method,
			url: xhr.responseURL,
			httpVersion:
				headers.find((header) => header.name === "httpVersion")?.value || "",
			cookies: [],
			headers,
			queryString: [],
			headersSize: headers.length,
			bodySize: xhr.response.length,
		};
		if (this._postData) {
			// TODO: pass parameters to the request
			request.postData = {
				mimeType: xhr.getResponseHeader("content-type") || "",
				text: this._postData.toString(),
			};
		}
		sendToBackground(JSON.stringify(request), ActionType.Request);
	}

	open(
		method: string,
		url: string | URL,
		async = true,
		username?: string,
		password?: string,
	): void {
		this._method = method;
		this._url = url.toString();
		this._requestHeaders = {};
		this._startTime = new Date().toISOString();
		super.open(method, url.toString(), async, username, password);
	}

	setRequestHeader(header: string, value: string): void {
		this._requestHeaders[header] = value;
		super.setRequestHeader(header, value);
	}

	send(postData?: Document | BodyInit | null): void {
		console.error("Sending request with postData", postData);
		if (postData) {
			this._postData = postData;
		}
		this.addEventListener(
			"load",
			(event: ProgressEvent<XMLHttpRequestEventTarget>) => {
				// 'event' is a ProgressEvent object
				const xhr = event.target as XMLHttpRequest; // Reference to the XMLHttpRequest instance
				this.parseAndSendCompletedRequest(xhr);
			},
		);

		this.addEventListener("error", () => {
			console.error("Request error.");
		});
		super.send(this._postData as XMLHttpRequestBodyInit);
	}
}

export default XHRWrapper;
