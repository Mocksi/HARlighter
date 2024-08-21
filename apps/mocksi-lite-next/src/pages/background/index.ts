console.log("background script loaded");

// when user clicks toolbar mount extension
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { message: "mount-extension" });
  } else {
    console.log("No tab found, could not mount extension");
  }
});

chrome.runtime.onMessage.addListener(
  (request, _sender, sendResponse): boolean => {
    console.log("Received message:", request);
    sendResponse({ message: request.message, status: "ok" });
    return true;
  },
);

chrome.runtime.onMessageExternal.addListener(
  (request, _sender, sendResponse): boolean => {
    console.log("Received message from external:", request);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { message: request.message });
      }
    });
    sendResponse({ message: request.message, status: "ok" });
    return true;
  },
);
