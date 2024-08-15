import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../../utils";
import { Storage } from "./Storage";

const TEST_STORAGE_KEY = "test-storage-key";
const TEST_TAB_ID = "test-tab-id";
const TEST_TAB_ID_2 = "test-tab-id-2";

describe("Storage", () => {
	const mockSet = vi.fn();
	const mockGet = vi.fn();
	const mockRemove = vi.fn();
	const mockStore = {
		get: mockGet,
		set: mockSet,
		remove: mockRemove,
	};

	let storage = new Storage(mockStore);

	beforeEach(() => {
		mockSet.mockClear();
		mockGet.mockClear();
		mockRemove.mockClear();

		storage = new Storage(mockStore);
		storage.tabId = TEST_TAB_ID;
	});

	describe("setItem", () => {
		it("should set item for a specific tab id", async () => {
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({ [TEST_TAB_ID]: {} }),
			);

			const testValue = "test-value-1";
			const result = await storage.setItem({ [TEST_STORAGE_KEY]: testValue });

			expect(result).toBe(true);
			expect(mockSet).toBeCalledWith({
				[TEST_TAB_ID]: { [TEST_STORAGE_KEY]: testValue },
			});
		});

		it("should retain existing data when setting", async () => {
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					[TEST_TAB_ID]: {
						"existing-key": "existing-value",
					},
				}),
			);

			const testValue = "test-value-1";
			const result = await storage.setItem({ [TEST_STORAGE_KEY]: testValue });

			expect(result).toBe(true);
			expect(mockSet).toBeCalledWith({
				[TEST_TAB_ID]: {
					[TEST_STORAGE_KEY]: testValue,
					"existing-key": "existing-value",
				},
			});
		});
	});

	describe("getItem", () => {
		it("should get item for a specific tab id", async () => {
			const testValue = "test-value-1";
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					"other-tab-id": { "fake-storage": "fake-value" },
					[TEST_TAB_ID]: { [TEST_STORAGE_KEY]: testValue },
				}),
			);

			const result = await storage.getItem([TEST_STORAGE_KEY]);

			expect(result).toEqual({ [TEST_STORAGE_KEY]: testValue });
		});

		it("should only get values for the keys provided", async () => {
			const testValue = "test-value-1";
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					[TEST_TAB_ID]: {
						[TEST_STORAGE_KEY]: testValue,
						"fake-storage": "fake-value",
					},
				}),
			);

			const result = await storage.getItem([TEST_STORAGE_KEY]);

			expect(result).toEqual({ [TEST_STORAGE_KEY]: testValue });
		});

		it("should return empty object if no data is found", async () => {
			mockGet.mockImplementationOnce(() => Promise.resolve({}));

			const result = await storage.getItem([TEST_STORAGE_KEY]);

			expect(result).toEqual({});
		});
	});

	describe("removeItem", () => {
		it("should remove item for a specific tab id", async () => {
			const testValue = "test-value-1";
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					[TEST_TAB_ID]: {
						[TEST_STORAGE_KEY]: testValue,
						"second-test-key": "second-value",
					},
				}),
			);

			const result = await storage.removeItem(TEST_STORAGE_KEY);

			expect(result).toBe(true);
			expect(mockSet).toBeCalledWith({
				[TEST_TAB_ID]: { "second-test-key": "second-value" },
			});
		});

		it("should return false if item doesnt exist", async () => {
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					[TEST_TAB_ID]: { "other-key": "other-value" },
				}),
			);

			const result = await storage.removeItem(TEST_STORAGE_KEY);

			expect(result).toBe(false);
		});
	});

	describe("clearStorageForTab", () => {
		it("should clear storage for a specific tab id", async () => {
			const result = await storage.clearStorageForTab(TEST_TAB_ID);

			expect(result).toBe(true);
			expect(mockRemove).toBeCalledWith(TEST_TAB_ID);
		});
	});

	describe("getStorageForTab", () => {
		it("should get storage for a specific tab id", async () => {
			const testValue = "test-value-1";
			mockGet.mockImplementationOnce(() =>
				Promise.resolve({
					[TEST_TAB_ID]: { [TEST_STORAGE_KEY]: testValue },
					"fake-tab-id": { nothing: "here" },
				}),
			);

			const result = await storage.getStorageForTab(TEST_TAB_ID);

			expect(result).toEqual({ [TEST_STORAGE_KEY]: testValue });
		});

		it("should return empty object if no data for tab is found", async () => {
			mockGet.mockImplementationOnce(() => Promise.resolve({}));

			const result = await storage.getStorageForTab(TEST_TAB_ID);

			expect(result).toEqual({});
		});
	});

	describe("setStorageForTab", () => {
		it("should set storage for a specific tab id", async () => {
			const testValue = "test-value-1";
			const result = await storage.setStorageForTab(TEST_TAB_ID, {
				[TEST_STORAGE_KEY]: testValue,
			});

			expect(result).toBe(true);
			expect(mockSet).toBeCalledWith({
				[TEST_TAB_ID]: { [TEST_STORAGE_KEY]: testValue },
			});
		});
	});

	describe("getTabId", () => {
		it("should return tab id if it exists", async () => {
			const result = await storage.getTabId();

			expect(result).toBe(TEST_TAB_ID);
		});

		it("should call sendMessage if tab id doesnt exist", async () => {
			storage.tabId = null;
			vi.mock(import("../../utils"), async (importOriginal) => {
				const original = await importOriginal();
				return {
					...original,
					sendMessage: vi.fn().mockImplementation((message, data, callback) => {
						callback({ body: { tabId: TEST_TAB_ID_2 } });
					}),
				};
			});

			await storage.getTabId();

			expect(sendMessage).toBeCalledWith("getTabId", {}, expect.any(Function));
		});

		it("should set tab id if it is returned from sendMessage", async () => {
			storage.tabId = null;
			vi.mock(import("../../utils"), async (importOriginal) => {
				const original = await importOriginal();
				return {
					...original,
					sendMessage: vi.fn().mockImplementation((message, data, callback) => {
						callback({ body: { tabId: TEST_TAB_ID_2 } });
					}),
				};
			});

			await storage.getTabId();

			expect(storage.tabId).toBe(TEST_TAB_ID_2);
		});
	});
});
