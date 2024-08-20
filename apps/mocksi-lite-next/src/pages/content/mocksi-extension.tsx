import { type ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { getHighlighter } from "./highlighter";

const div = document.createElement("div");
div.id = "__root";
// @ts-ignore
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
const reactor = new Reactor();
const highlighter = getHighlighter();

const Iframe = () => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    window.document.body.addEventListener("click", async (event) => {
      console.log("click!!!");
      const oldValue = "Engineering";
      const newValue = "Cats";
      const modification: ModificationRequest = {
        description: `Change ${oldValue} to ${newValue}`,
        modifications: [
          {
            action: "replaceAll",
            content: `/${oldValue}/${newValue}/`,
            selector: "body",
          },
        ],
      };
      console.log(modification);
      const modifications = await reactor.pushModification(modification);
      for (const modification of modifications) {
        modification.setHighlight(true);
      }
    });

    chrome.runtime.onMessage.addListener(
      (request, _sender, sendResponse): boolean => {
        if (request.message === "EDITING") {
          console.log("Time to attach reactor");
          reactor.attach(document, highlighter);
        } else if (request.message === "STOP_EDITING") {
          console.log("Time to detach reactor");
          reactor.detach();
        } else {
          // UI SIZING
          if (iframeRef.current) {
            if (request.message === "xs-bottom") {
              iframeRef.current.style.height = "100px";
              iframeRef.current.style.width = "100px";
              iframeRef.current.style.bottom = "10px";
              iframeRef.current.style.top = "auto";
            } else if (request.message === "sm-top") {
              iframeRef.current.style.height = "150px";
              iframeRef.current.style.width = "400px";
              iframeRef.current.style.top = "0px";
              iframeRef.current.style.bottom = "auto";
            } else if (request.message === "lg-bottom") {
              iframeRef.current.style.height = "600px";
              iframeRef.current.style.width = "500px";
              iframeRef.current.style.bottom = "10px";
              iframeRef.current.style.top = "auto";
            }
          }
        }
        sendResponse({ message: request.message, status: "ok" });
        return true;
      },
    );
  }, []);

  return (
    <div>
      {ReactDOM.createPortal(
        <>
          <iframe
            ref={iframeRef}
            seamless={true}
            src="http://localhost:3030/extension"
            style={{
              position: "fixed",
              bottom: "10px",
              right: "15px",
              height: "600px",
              width: "500px",
              boxShadow: "none",
              zIndex: 99998,
              border: "none",
              backgroundColor: "transparent",
            }}
          />
        </>,
        document.body,
      )}
    </div>
  );
};

root.render(<Iframe />);

try {
  console.log("content script loaded");
} catch (e) {
  console.error(e);
}
