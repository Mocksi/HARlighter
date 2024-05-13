import {
	ActionType,
	sendToBackground,
} from "../services/background_interactor";

class ApiRecorder {
	private XHR: typeof XMLHttpRequest;
	private originalXHR: typeof XMLHttpRequest;
	// TODO: do these need to be protected or private?
	protected requestHeaders: Record<string, string>;
	protected _method: string;
	protected _url: string;

	constructor() {
		this.XHR = XMLHttpRequest;
		this.originalXHR = XMLHttpRequest;
		this.requestHeaders = {};
		this.setupXHR();
	}

	setupXHR() {
		const open = this.originalXHR.prototype.open;
		const send = this.originalXHR.prototype.send;
		const setRequestHeader = this.originalXHR.prototype.setRequestHeader;

		this.XHR.prototype.open = function (
			method: string,
			url: string | URL,
			...args
		) {
			this._method = method;
			this._url = url.toString();
			return open.call(this, method, url, ...args);
		};

		this.XHR.prototype.setRequestHeader = function (
			header: string,
			value: string,
			...args
		) {
			this.requestHeaders = this.requestHeaders || {};
			this._requestHeaders[header] = value;
			return setRequestHeader.call(this, header, value, ...args);
		};

		this.XHR.prototype.send = function (postData?: Document | BodyInit | null) {
			this._postData = postData;
			this.addEventListener("load", () => {
				sendToBackground(this._method, ActionType.RequestMethod);
				sendToBackground(this._url.toLowerCase(), ActionType.RequestUrl);
				sendToBackground(
					JSON.stringify(this._postData),
					ActionType.RequestBody,
				);
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
	}
}

export default ApiRecorder;
