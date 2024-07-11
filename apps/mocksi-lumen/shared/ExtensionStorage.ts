interface StorageWrapper {
	// biome-ignore lint/suspicious/noExplicitAny: chrome API
	getStorageItem(key: string): Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: chrome API
	setStorageItem(key: string, value: any): Promise<void>;
	connectToPort(portName: string): chrome.runtime.Port;
	// biome-ignore lint/suspicious/noExplicitAny: chrome API
	sendMessage(port: chrome.runtime.Port, message: any): void;
	// biome-ignore lint/suspicious/noExplicitAny: chrome API
	onMessage(port: chrome.runtime.Port, callback: (message: any) => void): void;
}

interface Demo {
	id: string;
	name: string;
	customerName: string;
	createdAt: string;
	updatedAt: string;
}

interface SyncItem {
	id: string;
	type: "domain" | "demo" | "recording";
	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	data: any;
	syncStatus: "pending" | "synced" | "failed";
}

class ExtensionStorage implements StorageWrapper {
	private ports: { [key: string]: chrome.runtime.Port } = {};
	private messageHandlers: {
		// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
		[key: string]: (message: any, port: chrome.runtime.Port) => void;
	} = {};
	private syncQueue: SyncItem[] = [];

	constructor() {
		this.initializeConnectionListener();
		this.loadSyncQueue();
	}

	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	async getStorageItem(key: string): Promise<any> {
		return new Promise((resolve) => {
			chrome.storage.local.get(key, (result) => {
				resolve(result[key]);
			});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	async setStorageItem(key: string, value: any): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [key]: value }, resolve);
		});
	}

	connectToPort(portName: string): chrome.runtime.Port {
		const port = chrome.runtime.connect({ name: portName });
		this.ports[portName] = port;
		return port;
	}

	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	sendMessage(port: chrome.runtime.Port, message: any): void {
		port.postMessage(message);
	}

	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	onMessage(port: chrome.runtime.Port, callback: (message: any) => void): void {
		port.onMessage.addListener(callback);
	}

	private initializeConnectionListener(): void {
		chrome.runtime.onConnect.addListener((port) => {
			this.ports[port.name] = port;
			port.onMessage.addListener((message) => {
				if (this.messageHandlers[port.name]) {
					this.messageHandlers[port.name](message, port);
				}
			});
		});
	}

	registerMessageHandler(
		portName: string,
		// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
		handler: (message: any, port: chrome.runtime.Port) => void,
	): void {
		this.messageHandlers[portName] = handler;
	}

	async addDomainVisited(domain: string): Promise<void> {
		const domains = await this.getDomainsVisited();
		if (!domains.includes(domain)) {
			domains.push(domain);
			await this.setStorageItem("domainsVisited", domains);
			await this.addToSyncQueue({
				id: domain,
				type: "domain",
				data: domain,
				syncStatus: "pending",
			});
		}
	}

	async getDomainsVisited(): Promise<string[]> {
		return (await this.getStorageItem("domainsVisited")) || [];
	}

	async addDemo(demo: Demo): Promise<void> {
		const demos = await this.getDemos();
		demos.push(demo);
		await this.setStorageItem("demos", demos);
		this.addToSyncQueue({
			id: demo.id,
			type: "demo",
			data: demo,
			syncStatus: "pending",
		});
	}

	async getDemos(): Promise<Demo[]> {
		return (await this.getStorageItem("demos")) || [];
	}

	async updateDemo(updatedDemo: Demo): Promise<void> {
		const demos = await this.getDemos();
		const index = demos.findIndex((demo) => demo.id === updatedDemo.id);
		if (index !== -1) {
			demos[index] = updatedDemo;
			await this.setStorageItem("demos", demos);
			this.addToSyncQueue({
				id: updatedDemo.id,
				type: "demo",
				data: updatedDemo,
				syncStatus: "pending",
			});
		}
	}

	private addToSyncQueue(item: SyncItem): void {
		this.syncQueue.push(item);
		this.saveSyncQueue();
		this.triggerSync();
	}

	private async loadSyncQueue(): Promise<void> {
		const queueStr = await this.getStorageItem("syncQueue");
		this.syncQueue = queueStr ? JSON.parse(queueStr) : [];
	}

	private async saveSyncQueue(): Promise<void> {
		await this.setStorageItem("syncQueue", JSON.stringify(this.syncQueue));
	}

	async triggerSync(): Promise<void> {
		for (const item of this.syncQueue) {
			if (item.syncStatus === "pending") {
				try {
					await this.syncItemWithServer(item);
					item.syncStatus = "synced";
				} catch (error) {
					console.error("Sync failed for item:", item);
					item.syncStatus = "failed";
				}
			}
		}

		this.syncQueue = this.syncQueue.filter(
			(item) => item.syncStatus !== "synced",
		);

		await this.saveSyncQueue();
	}

	private async syncItemWithServer(item: SyncItem): Promise<void> {
		switch (item.type) {
			case "domain":
				await this.syncDomainWithServer(item.data);
				break;
			case "demo":
				await this.syncDemoWithServer(item.data);
				break;
			case "recording":
				await this.syncRecordingWithServer(item.data);
				break;
		}
	}

	private async syncDomainWithServer(domain: string): Promise<void> {
		// Implement API call to sync visited domain
	}

	private async syncDemoWithServer(demo: Demo): Promise<void> {
		// Implement API call to sync demo data
	}

	// biome-ignore lint/suspicious/noExplicitAny: arbitrary data
	private async syncRecordingWithServer(recording: any): Promise<void> {
		// Implement API call to sync recording data
	}

	handlePinnedStatus(): void {
		this.registerMessageHandler("pinStatus", async (message, port) => {
			if (message.action === "setPinned") {
				await this.setStorageItem("isPinned", message.value);
				port.postMessage({ success: true });
			} else if (message.action === "checkPinned") {
				const isPinned = (await this.getStorageItem("isPinned")) || false;
				port.postMessage({ action: "pinnedStatus", isPinned: isPinned });
			}
		});
	}
}

export default ExtensionStorage;
