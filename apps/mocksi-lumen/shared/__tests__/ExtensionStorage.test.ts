/// <reference types="chrome" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExtensionStorage from "../ExtensionStorage";

type ChromeMock = {
	storage: {
		local: {
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			get: any;
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			set: any;
		};
	};
	runtime: {
		// biome-ignore lint/suspicious/noExplicitAny: mock func
		connect: any;
		onConnect: {
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			addListener: any;
		};
	};
};

describe("ExtensionStorage", () => {
	let storage: ExtensionStorage;
	let chromeMock: ChromeMock;

	beforeEach(() => {
		chromeMock = {
			storage: {
				local: {
					get: vi.fn(),
					set: vi.fn(),
				},
			},
			runtime: {
				connect: vi.fn().mockReturnValue({
					onMessage: { addListener: vi.fn() },
					postMessage: vi.fn(),
				}),
				onConnect: { addListener: vi.fn() },
			},
		};

		global.chrome = chromeMock as unknown as typeof chrome;
		storage = new ExtensionStorage();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should set and get storage items", async () => {
		chromeMock.storage.local.set.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: tests
			(_obj: any, callback: any) => callback(),
		);
		await storage.setStorageItem("testKey", "testValue");
		expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
			{ testKey: "testValue" },
			expect.any(Function),
		);

		chromeMock.storage.local.get.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(key: any, callback: (arg0: { testKey: string }) => any) =>
				callback({ testKey: "testValue" }),
		);
		const value = await storage.getStorageItem("testKey");
		expect(chromeMock.storage.local.get).toHaveBeenCalledWith(
			"testKey",
			expect.any(Function),
		);
		expect(value).toBe("testValue");
	});

	it("should connect to a port", () => {
		const port = storage.connectToPort("testPort");
		expect(chromeMock.runtime.connect).toHaveBeenCalledWith({
			name: "testPort",
		});
		expect(port).toBeDefined();
	});

	it("should send messages through a port", () => {
		const port = storage.connectToPort("testPort");
		storage.sendMessage(port, { test: "message" });
		expect(port.postMessage).toHaveBeenCalledWith({ test: "message" });
	});

	it("should add and get domains visited", async () => {
		let storedDomains: string[] = [];

		// Mock storage.local.get
		chromeMock.storage.local.get.mockImplementation(
			(
				key: string,
				callback: (arg0: { domainsVisited?: string[] }) => void,
			) => {
				if (key === "domainsVisited") {
					callback({ domainsVisited: storedDomains });
				} else {
					callback({});
				}
			},
		);

		// Mock storage.local.set
		chromeMock.storage.local.set.mockImplementation(
			(obj: { domainsVisited: string[] }, callback: () => void) => {
				if (obj.domainsVisited) {
					storedDomains = obj.domainsVisited;
				}
				callback();
			},
		);

		// Add domains
		await storage.addDomainVisited("example.com");
		await storage.addDomainVisited("test.com");

		// Get domains
		const domains = await storage.getDomainsVisited();

		// Assert
		expect(domains).toEqual(["example.com", "test.com"]);
		expect(storedDomains).toEqual(["example.com", "test.com"]);
	});

	it("should add and get demos", async () => {
		const demo = {
			id: "1",
			name: "Test Demo",
			customerName: "Test Customer",
			createdAt: "2023-07-11",
			updatedAt: "2023-07-11",
		};
		chromeMock.storage.local.get.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(key: any, callback: (arg0: { demos: never[] }) => any) =>
				callback({ demos: [] }),
		);
		chromeMock.storage.local.set.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(obj: any, callback: () => any) => callback(),
		);
		await storage.addDemo(demo);
		expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
			{ demos: [demo] },
			expect.any(Function),
		);

		chromeMock.storage.local.get.mockImplementation(
			(
				// biome-ignore lint/suspicious/noExplicitAny: mock func
				key: any,
				callback: (arg0: {
					demos: {
						id: string;
						name: string;
						customerName: string;
						createdAt: string;
						updatedAt: string;
					}[];
					// biome-ignore lint/suspicious/noExplicitAny: mock func
				}) => any,
			) => callback({ demos: [demo] }),
		);
		const demos = await storage.getDemos();
		expect(demos).toEqual([demo]);
	});

	it("should update demos", async () => {
		const demo = {
			id: "1",
			name: "Test Demo",
			customerName: "Test Customer",
			createdAt: "2023-07-11",
			updatedAt: "2023-07-11",
		};
		const updatedDemo = { ...demo, name: "Updated Demo" };
		chromeMock.storage.local.get.mockImplementation(
			(
				// biome-ignore lint/suspicious/noExplicitAny: mock func
				key: any,
				callback: (arg0: {
					demos: {
						id: string;
						name: string;
						customerName: string;
						createdAt: string;
						updatedAt: string;
					}[];
					// biome-ignore lint/suspicious/noExplicitAny: mock func
				}) => any,
			) => callback({ demos: [demo] }),
		);
		chromeMock.storage.local.set.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(obj: any, callback: () => any) => callback(),
		);
		await storage.updateDemo(updatedDemo);
		expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
			{ demos: [updatedDemo] },
			expect.any(Function),
		);
	});

	it("should handle sync queue operations", async () => {
		const syncItem = {
			id: "1",
			type: "domain" as const,
			data: "example.com",
			syncStatus: "pending" as const,
		};
		chromeMock.storage.local.get.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(_key: any, callback: any) => callback({ syncQueue: "[]" }),
		);
		chromeMock.storage.local.set.mockImplementation(
			// biome-ignore lint/suspicious/noExplicitAny: mock func
			(_obj: any, callback: any) => callback(),
		);

		// @ts-ignore: Accessing private method for testing
		await storage.addToSyncQueue(syncItem);

		expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
			{ syncQueue: JSON.stringify([syncItem]) },
			expect.any(Function),
		);
	});
});
