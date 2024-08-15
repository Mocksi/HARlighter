console.log("background script loaded");

chrome.runtime.onMessage.addListener(
  (request, _sender, sendResponse): boolean => {
    console.log("Received message:", request);

    sendResponse({ message: request.message, status: "ok" });
    return true;
  },
);
