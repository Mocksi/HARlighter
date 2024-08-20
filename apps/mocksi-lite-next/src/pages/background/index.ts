console.log("background script loaded");

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
    if (
      request.message === "sm-top" ||
      request.message === "lg-bottom" ||
      request.message === "xs-bottom"
    ) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { message: request.message });
        }
      });
    }
    sendResponse({ message: request.message, status: "ok" });
    return true;
  },
);
