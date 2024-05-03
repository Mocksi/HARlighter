type Config = {
    mockData: Record<string, MockResponse>;
    delay?: number;
};

type MockResponse = {
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
            onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;
            response: any;
            responseText: string = "";
            responseType: string = "";
            status: number = 0;
            method: string;
            url: string;
            async: boolean;
            requestHeaders: Record<string, string> = {};
            responseHeaders: Record<string, string> = {};

            open(method: string, url: string, async: boolean = true) {
                this.method = method;
                this.url = url;
                this.async = async;
                this.readyState = FakeXMLHttpRequest.OPENED;
                this.triggerEvent("readystatechange");
            }

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
                    this.responseHeaders = mockResponse.ResponseHeaders || {};
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
                        this.response = new Blob([mockResponse.ResponseBody], { type: "application/octet-stream" });
                        break;
                    case "arrayBuffer":
                        const encoder = new TextEncoder();
                        this.response = encoder.encode(mockResponse.ResponseBody.toString()).buffer;
                        break;
                    case "text":
                    default:
                        this.response = mockResponse.ResponseBody.toString();
                        this.responseText = this.response;
                        break;
                }
            }

            private triggerEvent(type: string) {
                if (type === "readystatechange" && this.onreadystatechange) {
                    this.onreadystatechange(new Event(type));
                }
            }
        };
    }
}

export default ApiMock;
