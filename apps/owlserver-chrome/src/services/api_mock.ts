import { Blob, FormData, Headers, Response } from "node-fetch"; // Import node-fetch classes for types

type Config = {
	mockData: Record<string, MockResponse>;
	delay?: number;
};

type FetchOptions = {
	method?: string;
	headers?: HeadersInit;
	body?: Blob | FormData | ArrayBuffer | string; // More specific types instead of any
	signal?: AbortSignal;
};

type ResponseBodyType = Blob | FormData | ArrayBuffer | string;

type MockResponse = {
	ResponseStatus: number;
	ResponseBody: ResponseBodyType;
	ResponseHeaders?: HeadersInit;
	ResponseType?: "json" | "text" | "blob" | "formData" | "arrayBuffer";
	ResponseError?: string;
};

class ApiMock {
	private mockData: Record<string, MockResponse>;
	private delay: number;

	constructor(config: Config) {
		this.mockData = config.mockData;
		this.delay = config.delay ?? 100; // Default delay set to 100ms
	}

	async fetch(url: string, options: FetchOptions = {}): Promise<Response> {
		const { signal } = options;
		if (signal?.aborted) {
			return Promise.reject(
				new DOMException("The user aborted a request.", "AbortError"),
			);
		}

		await new Promise((resolve) => setTimeout(resolve, this.delay)); // Simulate network delay

		const method = (options.method || "GET").toUpperCase();
		const key = `${method} ${url}`;
		const mock = this.mockData[key];

		if (!mock) {
			return new Response(null, { status: 404 });
		}

		if (signal?.aborted) {
			return Promise.reject(
				new DOMException("The user aborted a request.", "AbortError"),
			);
		}

		const headers = new Headers(mock.ResponseHeaders);
		let body: ResponseBodyType = mock.ResponseBody;

		// Response based on the specified response type
		switch (mock.ResponseType) {
			case "json":
				body = JSON.stringify(body);
				break;
			case "blob":
				if (!(body instanceof Blob)) {
					body = new Blob([JSON.stringify(body)], {
						type: headers.get("Content-Type"),
					});
				}
				break;
			case "formData":
				if (!(body instanceof FormData)) {
					const formData = new FormData();
					// biome-ignore lint/complexity/noForEach: simpler this way
					Object.entries(body).forEach(([key, value]) =>
						formData.append(key, value.toString()),
					);
					body = formData;
				}
				break;
			case "arrayBuffer":
				if (!(body instanceof ArrayBuffer)) {
					// Convert string to ArrayBuffer if necessary
					const encoder = new TextEncoder();
					body = encoder.encode(body.toString()).buffer;
				}
				break;
			default:
				body = body.toString();
				break;
		}

		return new Response(body, {
			status: mock.ResponseStatus,
			headers: headers,
		});
	}
}

export default ApiMock;
