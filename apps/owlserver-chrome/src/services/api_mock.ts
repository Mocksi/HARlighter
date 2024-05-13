type Config = {
	mockData: Record<string, MockResponse>;
	delay?: number;
};

export type MockResponse = {
	ResponseStatus: number;
	ResponseBody: Blob | FormData | ArrayBuffer | string;
	ResponseHeaders?: HeadersInit;
	ResponseType?: "json" | "text" | "blob" | "formData" | "arrayBuffer";
};

class ApiMock {
	private mockData: Record<string, MockResponse>;
	private delay: number;

	constructor(config: Config) {
		this.mockData = config.mockData;
		this.delay = config.delay ?? 100; // Default delay
	}

	createFakeXHR() {
		const mock = this.mockData;
		const delay = this.delay;

		return class FakeXMLHttpRequest {
			static DONE = 4;
			static UNSENT = 0;
			static HEADERS_RECEIVED = 2;
			static LOADING = 3;
			static OPENED = 1;

			readyState: number = FakeXMLHttpRequest.UNSENT;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null =
				null;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			response: any;
			responseText = "";
			responseType = "";
			status = 0;
			statusText = ""; // Default empty status text
			responseURL = ""; // Default empty response URL
			responseXML = null; // Default null for responseXML
			timeout = 0; // Default timeout
			is_async: boolean;
			method: string;
			url: string;
			requestHeaders: Record<string, string> = {};
			responseHeaders: Record<string, string> = {};

			open(method: string, url: string, async = true) {
				this.method = method;
				this.url = url;
				this.is_async = async;
				this.readyState = FakeXMLHttpRequest.OPENED;
				this.triggerEvent("readystatechange");
			}

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			send(data?: any) {
				const responseKey = `${this.method} ${this.url}`;
				const mockResponse = mock[responseKey];

				if (!mockResponse) {
					this.status = 404;
					this.triggerEvent("readystatechange");
					this.triggerEvent("error");
					return;
				}

				setTimeout(() => {
					this.status = mockResponse.ResponseStatus;
					// Use the helper function to ensure type safety
					this.responseHeaders = ApiMock.convertHeaders(
						mockResponse.ResponseHeaders,
					);
					this.handleResponseType(mockResponse);
					this.readyState = FakeXMLHttpRequest.DONE;
					this.triggerEvent("readystatechange");
					this.triggerEvent("load");
				}, delay);
			}

			setRequestHeader(header: string, value: string) {
				this.requestHeaders[header] = value;
			}

			getAllResponseHeaders() {
				return this.responseHeaders;
			}

			abort() {
				this.readyState = FakeXMLHttpRequest.UNSENT;
				this.triggerEvent("abort");
			}

			private handleResponseType(mockResponse: MockResponse) {
				switch (mockResponse.ResponseType) {
					case "json":
						this.response = JSON.stringify(mockResponse.ResponseBody);
						this.responseText = this.response;
						break;
					case "blob":
						this.response = new Blob([mockResponse.ResponseBody as BlobPart], {
							type: "application/octet-stream",
						});
						break;
					case "arrayBuffer": {
						const encoder = new TextEncoder();
						this.response = encoder.encode(
							mockResponse.ResponseBody.toString(),
						).buffer;
						break;
					}
					// NOTE: Default also handles "text" case.
					default:
						this.response = mockResponse.ResponseBody.toString();
						this.responseText = this.response;

						if (!DOMParser) {
							return;
						}

						this.responseXML = new DOMParser().parseFromString(
							this.response,
							"text/xml",
						);
						break;
				}
			}

			private triggerEvent(type: string) {
				if (this.onreadystatechange) {
					// Explicitly setting the 'this' context to current instance when calling the handler
					this.onreadystatechange.call(this, new Event(type));
				}
			}
		};
	}

	private static convertHeaders(headers?: HeadersInit): Record<string, string> {
		if (!headers) return {};
		if (headers instanceof Headers) {
			const result: Record<string, string> = {};
			headers.forEach((value, key) => {
				result[key] = value;
			});
			return result;
		}
		if (Array.isArray(headers)) {
			return Object.fromEntries(headers);
		}
		return headers;
	}
}

export default ApiMock;
