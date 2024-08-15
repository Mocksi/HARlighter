import { sendMessage } from "../../utils";

interface StorageInterface {
	tabId: string | null;
	store: Store;
	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	getItem: (keys: string[]) => Promise<Record<string, any>>;
	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	setItem: (value: Record<string, any>) => Promise<boolean>;
	removeItem: (key: string) => Promise<boolean>;
	clearStorageForTab: (tabId: string) => Promise<boolean>;
	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	getStorageForTab: (tabId: string) => Promise<Record<string, any>>;
	setStorageForTab: (
		tabId: string,
		// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
		data: Record<string, any>,
	) => Promise<boolean>;
	getTabId: () => Promise<string | null>;
}

interface Store {
	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	get: (keys: string[] | string) => Promise<Record<string, any>>;
	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	set: (value: Record<string, any>) => Promise<void>;
	remove: (key: string) => Promise<void>;
}

export class Storage implements StorageInterface {
	tabId: string | null = null;
	store: Store;

	constructor(store: Store = chrome.storage.local) {
		this.store = store;
	}

	getItem = async (keys: string[]) => {
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
	};

	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	setItem = async (value: Record<string, any>) => {
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
	};

	removeItem = async (key: string) => {
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
	};

	clearStorageForTab = async (tabId: string) => {
		try {
			await this.store.remove(tabId);
			return true;
		} catch (error) {
			console.error("clearTab: error clearing local storage", error);
			return false;
		}
	};

	getStorageForTab = async (tabId: string) => {
		const storedData = await this.store.get([tabId]);

		if (!storedData[tabId]) {
			return {};
		}

		return storedData[tabId];
	};

	// biome-ignore lint/suspicious/noExplicitAny: this is a generic object and the item can be anything
	setStorageForTab = async (tabId: string, data: Record<string, any>) => {
		try {
			await this.store.set({ [tabId]: data });
			return true;
		} catch (error) {
			console.error("setStorageForTab: error setting local storage", error);
			return false;
		}
	};

	getTabId = async (): Promise<string | null> => {
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
	};
}
