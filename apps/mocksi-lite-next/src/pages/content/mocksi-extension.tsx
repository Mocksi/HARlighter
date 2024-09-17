import { createRoot } from "react-dom/client";
import { LayoutEvents } from "../events";
import MainIframe from "./main-iframe";
import TopIframe from "./top-iframe";

const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";

const div = document.createElement("div");
div.id = "__mocksi__root";
document.body.appendChild(div);

let mounted = false;

window.addEventListener("message", (event: MessageEvent) => {
  const eventData = event.data;

  if (event.source !== window || !eventData || !eventData.type) {
    return;
  }

  if (eventData.type.toUpperCase() === STORAGE_CHANGE_EVENT.toUpperCase()) {
    chrome.storage.local.set({ [eventData.key]: eventData.value }).then(() => {
      console.debug(eventData.key, " set.");
    });
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === LayoutEvents.MOUNT) {
    const rootContainer = document.querySelector("#__mocksi__root");
    if (!rootContainer) {
      throw new Error("Can't find Content root element");
    }

    const root = createRoot(rootContainer);

    function Iframes() {
      return (
        <>
          <TopIframe />
          <MainIframe />
        </>
      );
    }
    // avoid remounting react tree
    try {
      if (!mounted) {
        root.render(<Iframes />);
        mounted = true;
      }
      console.debug("content script loaded, extension iframe mounted");
    } catch (e) {
      console.error(e);
    }
  }
});
