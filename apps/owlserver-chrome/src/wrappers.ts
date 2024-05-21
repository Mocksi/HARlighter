// Import necessary classes and types
import APIRecorder from "./services/api_recorder";

// Define the mode types
enum ModeType {
	Record = "record",
	Mock = "mock",
	Original = "original",
}

// Declare new property on the window object
declare global {
	interface Window {
		wrapper: typeof XHRWrapper;
	}
}

// Define the XHRWrapper class
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class XHRWrapper extends XMLHttpRequest {
	public static originalXHR: typeof XMLHttpRequest = XMLHttpRequest;
	public static injectedXHR: typeof XMLHttpRequest = XMLHttpRequest;
	public static mode: ModeType = ModeType.Original;
	static XHRWrapper: typeof XHRWrapper;

	// Set the mode to record
	static record() {
		XHRWrapper.injectedXHR = APIRecorder; // Assuming APIRecorder extends XMLHttpRequest
		XHRWrapper.wrap(ModeType.Record);
	}

	// Revert to the original XMLHttpRequest
	static remove() {
		XHRWrapper.injectedXHR = XHRWrapper.originalXHR;
		XHRWrapper.wrap(ModeType.Original);
	}

	// Wrap the XMLHttpRequest with the specified mode
	static wrap(mode: ModeType) {
		XHRWrapper.mode = mode;
		((xhr) => XHRWrapper.injectedXHR)(XMLHttpRequest);
		window.XMLHttpRequest = XMLHttpRequest;
	}
}

if (typeof window !== "undefined") {
	window.wrapper = XHRWrapper; // Make the wrapper available globally on the window object
}

// Export the XHRWrapper class as a default export
export default XHRWrapper;
