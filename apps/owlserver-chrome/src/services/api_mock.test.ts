import { afterAll, beforeAll, describe, expect, test } from "vitest";
import ApiMock from "./api_mock";

// Mock setup for node-fetch to simulate a browser environment
beforeAll(() => {
	globalThis.fetch = fetch;
	globalThis.Headers = Headers;
	globalThis.Response = Response;
	globalThis.Blob = Blob;
	globalThis.FormData = FormData;
});

afterAll(() => {
	// biome-ignore lint/performance/noDelete: teardown
	delete globalThis.fetch;
	// biome-ignore lint/performance/noDelete: teardown
	delete globalThis.Headers;
	// biome-ignore lint/performance/noDelete: teardown
	delete globalThis.Response;
	// biome-ignore lint/performance/noDelete: teardown
	delete globalThis.Blob;
	// biome-ignore lint/performance/noDelete: teardown
	delete globalThis.FormData;
});

// Define mock data with various response types and scenarios
const mockData = {
	"GET /api/text": {
		ResponseBody: "Simple text response",
		ResponseStatus: 200,
		ResponseHeaders: { "Content-Type": "text/plain" },
		ResponseType: "text",
	},
	"POST /api/json": {
		ResponseBody: { message: "Data received" },
		ResponseStatus: 201,
		ResponseHeaders: { "Content-Type": "application/json" },
		ResponseType: "json",
	},
	"PUT /api/blob": {
		ResponseBody: new Blob(["binary data"], {
			type: "application/octet-stream",
		}),
		ResponseStatus: 200,
		ResponseHeaders: { "Content-Type": "application/octet-stream" },
		ResponseType: "blob",
	},
	"DELETE /api/formData": {
		ResponseBody: new FormData(),
		ResponseStatus: 204,
		ResponseHeaders: { "Content-Type": "multipart/form-data" },
		ResponseType: "formData",
	},
};

// Tests for different response types
describe("ApiMock tests for different HTTP methods and response types", () => {
	const apiMock = new ApiMock({ mockData, delay: 100 });

	test("should handle text response correctly", async () => {
		const response = await apiMock.fetch("/api/text");
		expect(await response.text()).toBe("Simple text response");
		expect(response.headers.get("Content-Type")).toBe("text/plain");
	});

	test("should handle JSON response correctly", async () => {
		const response = await apiMock.fetch("/api/json", { method: "POST" });
		expect(await response.json()).toEqual({ message: "Data received" });
		expect(response.status).toBe(201);
	});

	test("should handle Blob response correctly", async () => {
		const response = await apiMock.fetch("/api/blob", { method: "PUT" });
		expect(response.headers.get("Content-Type")).toBe(
			"application/octet-stream",
		);
		const blob = await response.blob();
		expect(blob.size).toBeGreaterThan(0);
	});

	test("should handle FormData response correctly", async () => {
		const response = await apiMock.fetch("/api/formData", { method: "DELETE" });
		expect(response.headers.get("Content-Type")).toBe("multipart/form-data");
		expect(response.status).toBe(204);
	});

	test("should handle aborted requests", async () => {
		const abortController = new AbortController();
		const fetchPromise = apiMock.fetch("/api/text", {
			signal: abortController.signal,
		});
		abortController.abort();

		try {
			await fetchPromise;
			//
		} catch (error: unknown) {
			const errorName = (error as Error)?.name;
			expect(errorName).toBe("AbortError");
		}
	});
});
