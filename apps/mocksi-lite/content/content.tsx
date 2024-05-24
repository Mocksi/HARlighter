import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";
import { ChromeMessageNames, EventNames } from "./constants";

// Define the expected response type
interface TabIdResponse {
  tabId?: number;
}


chrome.runtime.sendMessage({ message: "getCurrentTabId" }, (response: TabIdResponse) => {
  if (response?.tabId !== undefined) {
    console.log('Received tabId:', response.tabId);
  } else {
    console.error('Failed to get current tab ID or tabId is undefined');
  }
});


// biome-ignore lint/suspicious/noExplicitAny: <explanation>
chrome.runtime.sendMessage({ message: "blah" }, (response: any) => {
  console.log('Received response:', response);
});

let root: ReactDOM.Root;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.text === "clickedIcon") {
    const extensionRoot = document.getElementById("extension-root");
    if (extensionRoot) {
      if (root) {
        root.unmount();
      }
      root = ReactDOM.createRoot(extensionRoot);
      // FIXME: bring back the session cookie
      root.render(<ContentApp isOpen={true} sessionCookie={"whatever"} />);
    }
  }
});

function initial() {
  const rootDiv = document.getElementById("extension-root") || document.createElement("div");
  rootDiv.id = "extension-root";
  document.body.appendChild(rootDiv);
}

setTimeout(initial, 1000);


document.addEventListener(EventNames.RECORDING_DATA_CAPTURED, (e: Event): void => {
  const jsonHolder = document.getElementById("jsonHolder");
  const data = jsonHolder?.getAttribute("src") || "";
  jsonHolder?.remove();
  chrome.runtime.sendMessage(
    { message: ChromeMessageNames.SEND_RECORDING_PACKET, data },
    (response) => {
      if (response.status !== "success") {
        console.log(response);
      }
    }
  );
});
