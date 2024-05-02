"use client";

type Config = {
    mockData: Record<string, MockResponse>;
    delay?: number;
};

type FetchOptions = {
    method?: string;
    headers?: HeadersInit;
    body?: string;
};

type MockResponse = {
    ResponseStatus: number;
    ResponseBody: string;
    ResponseHeaders?: HeadersInit;
    ResponseError?: string;
};

class ApiMock {
    private mockData: Record<string, MockResponse>;
    private delay: number;

    constructor(config: Config) {
        this.mockData = config.mockData;
        this.delay = config.delay ?? 100;  // Default delay set to 100ms
    }

    async fetch(url: string, options?: FetchOptions): Promise<Response> {
        await new Promise(resolve => setTimeout(resolve, this.delay));  // Simulate network delay

        const method = (options?.method || 'GET').toUpperCase();  // Default method to GET
        const key = `${method} ${url}`;

        const response = this.mockData[key];

        if (!response) {
            return new Response(null, { status: 404 });
        }

        return new Response(response.ResponseBody, {
            status: response.ResponseStatus,
            headers: response.ResponseHeaders
        });
    }
}

export default ApiMock;
