import ApiMock, { type MockResponse } from "./services/api_mock";

enum ModeType {
	Record = "record",
	Mock = "mock",
	Original = "original",
}

// biome-ignore lint/complexity/noStaticOnlyClass: wrapper got to wrap.
class XHRWrapper extends XMLHttpRequest {
	public static originalXHR = XMLHttpRequest;
	// biome-ignore lint/suspicious/noExplicitAny: it's ok:
	public static injectedXHR: any = XMLHttpRequest;
	public static mockData: Record<string, MockResponse>;
	public static mode: ModeType = ModeType.Original;

	static record() {
		XHRWrapper.wrap(ModeType.Record);
	}

	static mock(mockData: Record<string, MockResponse>) {
		XHRWrapper.injectedXHR = ApiMock; // Assuming ApiMock is compatible with XMLHttpRequest interface
		XHRWrapper.mockData = mockData;
		XHRWrapper.wrap(ModeType.Mock);
	}

	static remove() {
		XHRWrapper.injectedXHR = XMLHttpRequest;
		XHRWrapper.wrap(ModeType.Original);
	}

	static wrap(mode: ModeType) {
		XHRWrapper.mode = mode;
		const xhrFactory = () => new XHRWrapper.injectedXHR();
		// Copy over all static properties and methods from XMLHttpRequest to xhrFactory
		Object.assign(xhrFactory, XMLHttpRequest);
		window.XMLHttpRequest = xhrFactory as unknown as typeof XMLHttpRequest;
	}
}

if (typeof window !== "undefined") {
	XHRWrapper.record(); // Supply necessary mock data
}
