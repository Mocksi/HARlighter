interface ChromeMessage {
  message: string;
  status?: string;
}

interface ChromeMessageWithData extends ChromeMessage {
  data: string;
}

const buffer: string[] = [];
let recordingState = true;

// TODO:: make this neater
chrome.storage.local.get("recordingState", (result) => {
  recordingState = result.recordingState || false;
});

chrome.runtime.onMessage.addListener(
  (
    request: ChromeMessageWithData,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ChromeMessage) => void,
  ): void => {
    // FIXME: refactor this to use a switch statement
    if (request.message === "startRecording") {
      recordingState = true;
      chrome.storage.local.set({ recordingState });
      sendResponse({ message: request.message, status: "success" });
      return;
    }
    if (request.message === "stopRecording") {
      recordingState = false;
      chrome.storage.local.set({ recordingState });
      sendResponse({ message: request.message, status: "success" });
      return;
    }

    // FIXME: check recordingState
    if (request.message === "wrapperToBackground") {
      if (request.data.length > 0) {
        buffer.push(request.data);
      }
      sendResponse({ message: "backgroundToPopup", status: "ok" });
      return;
    }
    sendResponse({ message: request.message, status: "pending" });
  },
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const dataUnencoded = { tabId, url: tab.url, title: tab.title };
    const data = btoa(JSON.stringify(dataUnencoded));

    const payload = {
      dataType: "tab_data",
      data: data,
      timestamp: nowTimestampB(),
    };
    webSocket.send(JSON.stringify(payload));
  }
});

let webSocket = new WebSocket("ws://localhost:8080/ws");
webSocket.onopen = (event) => {
  console.log("websocket open");
  keepAlive();
};

webSocket.onmessage = (event) => {
  console.log(`websocket received message: ${event.data}`);
};

webSocket.onclose = (event) => {
  console.log("websocket connection closed");
  webSocket = null;
};

function disconnect() {
  if (webSocket == null) {
    return;
  }
  webSocket.close();
}

function keepAlive() {
  const keepAliveIntervalId = setInterval(
    () => {
      if (webSocket) {
        webSocket.send('{ "type": "keepalive" }');
      } else {
        clearInterval(keepAliveIntervalId);
      }
    },
    // Set the interval to 20 seconds to prevent the service worker from becoming inactive.
    20 * 1000,
  );
}

// FIXME: this is duplicated in wrappers.ts
function nowTimestampB(): number {
  return Math.floor(Date.now() / 1000);
}

function sendDataToServer(): void {
  console.log("sending data to server");
  buffer.map((data) => {
    const payload = {
      dataType: "bData",
      data: data,
      timestamp: nowTimestampB(),
    };
    webSocket.send(JSON.stringify(payload));
  });

  buffer.length = 0; // Clear the buffer after sending the data
}

// send data every 2 seconds
setInterval(sendDataToServer, 2000);
