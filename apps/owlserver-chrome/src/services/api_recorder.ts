import { ActionType, sendToBackground } from "./background_interactor";

class APIRecorder extends XMLHttpRequest {
	private _method: string;
	private _url: string;
	private _requestHeaders: Record<string, string> = {};
	// biome-ignore lint/suspicious/noExplicitAny: it's fine
	private _postData: any;
	private _startTime: string;

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
		this._postData = {};
		super.open(method, url.toString(), async, username, password);
	}

	setRequestHeader(header: string, value: string): void {
		this._requestHeaders[header] = value;
		super.setRequestHeader(header, value);
	}

	send(postData?: Document | BodyInit | null): void {
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
				case "blob":
					responseBody = "BLOB";
					break;
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
				sendToBackground(responseBody, ActionType.ResponseBody);
			}
		});
		super.send(postData as XMLHttpRequestBodyInit);
	}
}

export default APIRecorder;
