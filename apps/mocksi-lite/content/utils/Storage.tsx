import { sendMessage } from "../../utils";

// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
type StoredItemType = { [key: string]: any };

interface StorageInterface {
	tabId: string | null;
	store: Store;
	getItem(keys: string[]): Promise<StoredItemType>;
	setItem(value: StoredItemType): Promise<boolean>;
	removeItem(key: string): Promise<boolean>;
	clearStorageForTab(tabId: string): Promise<boolean>;
	getStorageForTab(tabId: string): Promise<StoredItemType>;
	setStorageForTab(tabId: string, data: StoredItemType): Promise<boolean>;
	getTabId(): Promise<string | null>;
}

interface Store {
	get(keys: string[] | string): StoredItemType;
	set(value: StoredItemType): Promise<void>;
	remove(key: string): Promise<void>;
}

export class Storage implements StorageInterface {
	tabId: string | null = null;
	store: Store;

	constructor(store: Store = chrome.storage.local) {
		this.store = store;
	}

	async getItem(keys: string[]): Promise<StoredItemType> {
		const tabId = await this.getTabId();

		if (!tabId) {
			console.error("Tab id not found");
			return [];
		}

		const storedData = await this.store.get(tabId);
		const data = storedData[tabId];

		if (!data) {
			return {};
		}

		return keys.reduce((acc, curr) => {
			if (data[curr]) {
				return {
					// biome-ignore lint/performance/noAccumulatingSpread: this is a small object and spreading is fine
					...acc,
					[curr]: data[curr],
				};
			}

			return acc;
		}, {});
	}

	async setItem(value: StoredItemType): Promise<boolean> {
		const tabId = await this.getTabId();
		if (!tabId) {
			console.error("Tab id not found");
			return false;
		}

		const data = await this.getStorageForTab(tabId);

		const newData = {
			...data,
			...value,
		};

		try {
			await this.store.set({ [tabId]: newData });
			return true;
		} catch (error) {
			console.error("setItem: error setting local storage", error);
			return false;
		}
	}

	async removeItem(key: string): Promise<boolean> {
		const tabId = await this.getTabId();
		if (!tabId) {
			console.error("Tab id not found");
			return false;
		}

		const data = await this.getStorageForTab(tabId);

		if (!data[key]) {
			return false;
		}

		const { [key]: removed, ...toKeep } = data;

		const result = await this.setStorageForTab(tabId, toKeep);

		return result;
	}

	async clearStorageForTab(tabId: string): Promise<boolean> {
		try {
			await this.store.remove(tabId);
			return true;
		} catch (error) {
			console.error("clearTab: error clearing local storage", error);
			return false;
		}
	}

	async getStorageForTab(tabId: string): Promise<StoredItemType> {
		const storedData = await this.store.get([tabId]);

		if (!storedData[tabId]) {
			return {};
		}

		return storedData[tabId];
	}

	async setStorageForTab(
		tabId: string,
		data: StoredItemType,
	): Promise<boolean> {
		try {
			await this.store.set({ [tabId]: data });
			return true;
		} catch (error) {
			console.error("setStorageForTab: error setting local storage", error);
			return false;
		}
	}

	async getTabId(): Promise<string | null> {
		if (this.tabId) {
			return this.tabId;
		}

		return new Promise((resolve) => {
			sendMessage("getTabId", {}, (response) => {
				if (response.status !== "success") {
					resolve(null);
				}

				const body = response.body as { tabId: string };
				const tabId = body.tabId;

				if (tabId) {
					this.tabId = tabId.toString();
					resolve(this.tabId);
				} else {
					resolve(null);
				}
			});
		});
	}
}

export const storage = new Storage();
