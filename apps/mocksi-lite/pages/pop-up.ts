const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({});
const tabsSelectDom = document.getElementById("tabs") as HTMLSelectElement;

for (const tab of tabs) {
    const option = document.createElement("option");
    option.text = tab.title || 'No Title';
    option.value = tab.id?.toString() || '';
    tabsSelectDom.add(option);
}


tabsSelectDom.addEventListener('change', (e) => {
    (async () => {
        if (!(e.target instanceof HTMLSelectElement)) {
            console.error('Not an instance of HTMLSelectElement: ', e.target);
            return;
        }
        if (!e.target.value) {
            console.error('No tab selected. ', e.target)
            return;
        }
        const tabId = e.target.value;
        const message = "tabSelected"
        const response = await chrome.runtime.sendMessage({ tabId, message });
        if (response?.status !== "success") {
            console.error('Failed to send message to background script');
            return;
        }
        // FIXME: pick a better key and store the key name in a constant
        localStorage.setItem('selected-tabId', tabId);
    })();
});

export type { };