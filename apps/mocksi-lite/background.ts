import { ChromeMessageNames } from "./content/constants";

interface ChromeMessage {
  message: string;
  status?: string;
  tabId?: number;
}

interface ChromeMessageWithData extends ChromeMessage {
  data: string;
}

chrome.action.onClicked.addListener((tab) => {
  chrome.cookies.get(
    { url: "https://mocksi-auth.onrender.com/", name: "sessionid" },
    (cookie) => {
      chrome.tabs.sendMessage(tab.id || 0, {
        text: "clickedIcon",
        loginToken: cookie?.value || "",
      });
    }
  );
});

chrome.runtime.onMessage.addListener(
  (
    request: ChromeMessageWithData,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeMessage) => void
  ): boolean => {
    console.log('Received message:', request);
    if (request.message === "getCurrentTabId") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          console.error("No active tabs found");
          sendResponse({ message: request.message, status: "error", tabId: undefined });
          return;
        }
        const currentTab = tabs[0];
        console.log("Current tab:", currentTab.id);
        if (currentTab.id === undefined) {
          console.error("Current tab ID is undefined");
          sendResponse({ message: request.message, status: "error", tabId: undefined });
          return;
        }
        const tabId = currentTab.id;
        chrome.scripting.executeScript({
          target: { tabId},
          func: () => {
            console.log('added yellow background');
          }
        });
        sendResponse({ message: request.message, status: "ok", tabId });
      });
      return true; // Indicate that the response is sent asynchronously
    }

    if (request.message === ChromeMessageNames.SEND_RECORDING_PACKET) {
      webSocket?.send(request.data);
      sendResponse({ message: request.message, status: "ok" });
      return true; // Indicate that the response is sent asynchronously
    }
    return false; // No async response for other messages
  }
);

console.log("background script loaded");

const wsUrl = "ws://localhost:8090/ws";
const webSocket = new WebSocket(wsUrl);

webSocket.onopen = () => {
  keepAlive();
};

webSocket.onmessage = (event) => {
  console.log(`websocket received message: ${event.data}`);
};

webSocket.onclose = () => {
  console.log("websocket connection closed");
};

function disconnect() {
  if (webSocket == null) {
    return;
  }
  webSocket.close();
}

function keepAlive() {
  const keepAliveIntervalId = setInterval(() => {
    if (webSocket) {
      webSocket.send("keepalive");
    } else {
      clearInterval(keepAliveIntervalId);
    }
  }, 20 * 1000);
}
