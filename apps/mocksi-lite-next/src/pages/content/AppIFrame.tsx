import { useEffect } from "react";
import Frame from "react-frame-component";

function EnFrame() {
  document.body.addEventListener("click", (event) => {
    chrome.runtime.sendMessage(
      `${event.target} clicked in main document`,
      (response) => {
        console.log("response from background script", response);
      },
    );
  });

  useEffect(() => {
    console.log("doc on load!", document);
  }, []);

  return (
    <button
      className="btn"
      onClick={(e) => {
        chrome.runtime.sendMessage(
          `${e.target} clicked in iframe`,
          (response) => {
            console.log("response from background script", response);
          },
        );
      }}
    >
      click me!
    </button>
  );
}

function AppIframe() {
  return (
    <Frame>
      <EnFrame />
    </Frame>
  );
}

export default AppIframe;
