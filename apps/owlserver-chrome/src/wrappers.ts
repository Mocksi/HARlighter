import "./observers/document";
import { ActionType, sendToBackground } from "./services/background_interactor";

((xhr) => {
	const XHR = XMLHttpRequest.prototype;

	const open = XHR.open;
	const send = XHR.send;
	const setRequestHeader = XHR.setRequestHeader;

	XHR.open = function (method: string, url: string | URL) {
		this._method = method;
		this._url = url.toString();
		this._requestHeaders = {};
		this._startTime = new Date().toISOString();
		this._postData = {};
		// biome-ignore lint/style/noArguments: dynamic
		return open.apply(this, arguments);
	};

	XHR.setRequestHeader = function (header: string, value: string) {
		this._requestHeaders[header] = value;

		// biome-ignore lint/style/noArguments: dynamic
		return setRequestHeader.apply(this, arguments);
	};

	XHR.send = function (postData?: Document | BodyInit | null) {
		this._postData = postData;
		this.addEventListener("load", () => {
			sendToBackground(this._method, ActionType.RequestMethod);
			sendToBackground(this._url.toLowerCase(), ActionType.RequestUrl);
			sendToBackground(JSON.stringify(this._postData), ActionType.RequestBody);
			sendToBackground(
				JSON.stringify(this._requestHeaders),
				ActionType.RequestHeaders,
			);

			const responseHeaders = this.getAllResponseHeaders();
			sendToBackground(
				JSON.stringify(responseHeaders),
				ActionType.ResponseHeaders,
			);

			let responseBody = "";
			switch (this.responseType) {
				case "":
				case "text":
					responseBody = this.responseText;
					break;
				case "arraybuffer": {
					const buffer = new Uint8Array(this.response);
					const decoder = new TextDecoder();
					responseBody = decoder.decode(buffer);
					break;
				}
				case "blob": {
					responseBody = "BLOB";
					break;
				}
				case "document": {
					const serializer = new XMLSerializer();
					responseBody = serializer.serializeToString(this.response);
					break;
				}
				case "json":
					responseBody = JSON.stringify(this.response);
					break;
			}
			if (this.responseType !== "blob") {
				// Ensure we do not send blob data synchronously
				sendToBackground(responseBody, ActionType.ResponseBody);
			}
		});

		// biome-ignore lint/style/noArguments: dynamic
		return send.apply(this, arguments);
	};
})(XMLHttpRequest);

window.XMLHttpRequest = XMLHttpRequest; // Ensure global XMLHttpRequest is modified
