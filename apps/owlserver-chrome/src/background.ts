interface ChromeMessage {
  message: string;
  status?: string;
}

interface ChromeMessageWithData extends ChromeMessage {
  data: string;
}

const buffer: string[] = [];

chrome.runtime.onMessage.addListener(
  (request: ChromeMessageWithData, sender: chrome.runtime.MessageSender, sendResponse: (response: ChromeMessage) => void): void => {
    if (request.message === "wrapperToBackground") {
      buffer.push(request.data);
      sendResponse({ message: "backgroundToPopup", status: "ok" });
    } else {
      sendResponse({ message: request.message, status: "pending" });
    }
  }
);

function sendDataToBeacon(): void {
  if (buffer.length > 0) {
    const dataToSend: string = JSON.stringify(buffer);
    //navigator.sendBeacon("http://localhost:3002", dataToSend);
    console.log("Data sent to the beacon:", dataToSend);

    buffer.map((data) => {
      const parsedData = JSON.parse(data);
      const decodedPayload = atob(parsedData.payload);
      console.log("Decoded payload:", decodedPayload);
    });

    buffer.length = 0; // Clear the buffer after sending the data
  }
}

// send data every 5 seconds
setInterval(sendDataToBeacon, 5000);
