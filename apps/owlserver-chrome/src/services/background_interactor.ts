/**
 * returns the current unix timestamp in seconds
 * @returns unix timestamp in seconds
 */
function nowTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

export enum ActionType {
	Click = "click",
	Navigate = "navigate",
	RequestHeaders = "requestHeaders",
	RequestUrl = "requestUrl",
	RequestMethod = "requestMethod",
	RequestBody = "requestBody",
	ResponseBody = "responseBody",
	ResponseHeaders = "responseHeaders",
	ResponseError = "responseError",
	Abort = "abort",
	HTMLTags = "htmlTags",
	KeyboardEvent = "keyboardEvent",
	DOMContentLoaded = "DOMContentLoaded",
	Input = "input",
}

/**
 *
 * @param data Data to send to the background
 * @param dataType Type of data being sent
 * @returns void
 */
export function sendToBackground(data: string, dataType: ActionType): void {
	if (!data || !document) {
		return;
	}
	const jsonHolder = document.createElement("script");
	jsonHolder.type = "application/json";
	jsonHolder.id = "jsonHolder";
	const timestamp = nowTimestamp();
	const payload = { dataType, data: data, timestamp };
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
		const event = new CustomEvent("wrapperToBackground", { detail: view });
		document.dispatchEvent(event);
	} else {
		console.error("Default view is not available");
	}
}
