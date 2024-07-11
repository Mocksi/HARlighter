// biome-ignore lint/style/useImportType: types don't work here
import ExtensionStorage from "../shared/ExtensionStorage";

class BackgroundSync {
	private storage: ExtensionStorage;
	private syncInterval: number = 5 * 60 * 1000; // 5 minutes
	private intervalId: number | null = null;

	constructor(storage: ExtensionStorage) {
		this.storage = storage;
	}

	start(): void {
		if (this.intervalId === null) {
			this.intervalId = setInterval(
				() => this.sync(),
				this.syncInterval,
			) as unknown as number;
			this.sync(); // Run an initial sync
		}

		// Attempt to sync when coming back online
		window.addEventListener("online", () => this.sync());
	}

	stop(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private async sync(): Promise<void> {
		if (navigator.onLine) {
			try {
				await this.storage.triggerSync();
				console.log("Sync completed successfully");
			} catch (error) {
				console.error("Sync failed:", error);
			}
		} else {
			console.log("Sync skipped: offline");
		}
	}
}

export default BackgroundSync;
