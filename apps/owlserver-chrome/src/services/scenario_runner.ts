"use client";

type Config = {
	delay?: number;
};

type FetchOptions = {
	method?: string;
	dataType?: string;
};

type MockResponse = {
	body: string;
	status: number;
	headers?: HeadersInit;
};

class ApiMock {
	private mockData: Record<string, MockResponse>;
	private delay: number;

	constructor(config: Config) {
		this.mockData = config.mockData;
		this.delay = config.delay ?? 100; // Use nullish coalescing instead of logical OR for default value
	}

	async fetch(url: string, options?: FetchOptions): Promise<Response> {
		const response = this.findMockResponse(url, options);
		if (response) {
			return Promise.resolve(
				new Response(JSON.stringify(response.body), {
					status: response.status,
					headers: response.headers,
				}),
			);
		}
		return Promise.resolve(new Response(null, { status: 404 }));
	}

	private findMockResponse(
		url: string,
		options?: FetchOptions,
	): MockResponse | null {
		if (this.mockData[url]) {
			return this.mockData[url];
		}

		const methodUrlKey = options?.method
			? `${options.method.toUpperCase()} ${url}`
			: "";
		if (this.mockData[methodUrlKey]) {
			return this.mockData[methodUrlKey];
		}

		const dataTypeKey = options?.dataType ?? "";
		if (this.mockData[dataTypeKey]) {
			return this.mockData[dataTypeKey];
		}
		return null;
	}
}

export default ApiMock;
