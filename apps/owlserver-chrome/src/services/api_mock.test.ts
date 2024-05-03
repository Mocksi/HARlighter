import { afterAll, beforeAll, describe, expect, test } from "vitest";
import ApiMock from "./api_mock";

// Mock setup to simulate a browser XMLHttpRequest environment
beforeAll(() => {
	const apiMock = new ApiMock({ mockData });
	globalThis.XMLHttpRequest = apiMock.createFakeXHR() as unknown as typeof XMLHttpRequest;
});

afterAll(() => {
	// biome-ignore lint/performance/noDelete: <explanation>
	delete globalThis.XMLHttpRequest;
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
        ResponseBody: new Blob(["binary data"], { type: "application/octet-stream" }),
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

// Tests for different response types using XMLHttpRequest
describe("ApiMock tests for different HTTP methods and response types", () => {

    test("should handle text response correctly", (done) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/text");
        xhr.onload = () => {
            expect(xhr.responseText).toBe("Simple text response");
            expect(xhr.getResponseHeader("Content-Type")).toBe("text/plain");
            done();
        };
        xhr.send();
    });

    test("should handle JSON response correctly", (done) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/json");
        xhr.onload = () => {
            expect(JSON.parse(xhr.responseText)).toEqual({ message: "Data received" });
            expect(xhr.status).toBe(201);
            done();
        };
        xhr.send();
    });

    test("should handle Blob response correctly", (done) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.open("PUT", "/api/blob");
        xhr.onload = () => {
            expect(xhr.response.size).toBeGreaterThan(0);
            expect(xhr.getResponseHeader("Content-Type")).toBe("application/octet-stream");
            done();
        };
        xhr.send();
    });

    test("should handle FormData response correctly", (done) => {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", "/api/formData");
        xhr.onload = () => {
            expect(xhr.status).toBe(204);
            // FormData is not directly inspectable in the response, just check for correct handling
            done();
        };
        xhr.send();
    });

    test("should handle aborted requests", (done) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/text");
        xhr.onerror = () => {
            expect(xhr.statusText).toBe("AbortError");
            done();
        };
        xhr.send();
        xhr.abort();
    });
});
