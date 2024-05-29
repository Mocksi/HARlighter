chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
	const tabsSelectDom = document.getElementById("tabs") as HTMLSelectElement;

	for (const tab of tabs) {
		const option = document.createElement("option");
		option.text = tab.title || "Unknown";
		option.value = tab.id?.toString() || "";
		tabsSelectDom.add(option);
	}

	tabsSelectDom.addEventListener("change", (e) => {
		if (!(e.target instanceof HTMLSelectElement)) {
			console.error("Not an instance of HTMLSelectElement: ", e.target);
			return;
		}
		if (!e.target.value) {
			console.error("No tab selected. ", e.target);
			return;
		}
		const tabIdValue = e.target.value;
		const tabId = Number.parseInt(tabIdValue, 10);
		const message = "tabSelected";

		chrome.runtime.sendMessage({ tabId, message }, (response) => {
			if (response?.status !== "success") {
				console.error("Failed to send message to background script");
				return;
			}
		});
	});
});

export type {};
