/// <reference types="chrome" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ExtensionStorage from "../../shared/ExtensionStorage";
import BackgroundSync from "../backgroundSync";

// FIXME: this is duplicated in ExtensionStorage.test.ts
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

// Mock the ExtensionStorage class
class MockExtensionStorage extends ExtensionStorage {
	triggerSync = vi.fn();
}

describe("BackgroundSync", () => {
	let backgroundSyncInstance: BackgroundSync;
    let mockStorage: MockExtensionStorage;

	beforeEach(() => {
		const chromeMock: ChromeMock = {
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

		mockStorage = new MockExtensionStorage();
		backgroundSyncInstance = new BackgroundSync(mockStorage);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should start syncing", () => {
		backgroundSyncInstance.start();
		expect(mockStorage.triggerSync).toHaveBeenCalled();
	});

	it("should stop syncing", () => {
		backgroundSyncInstance.start();
		backgroundSyncInstance.stop();
		expect(mockStorage.triggerSync).toHaveBeenCalledTimes(1); // Only the initial sync should have been called
	});
});