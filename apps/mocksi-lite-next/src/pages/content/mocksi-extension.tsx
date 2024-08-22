import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { getHighlighter } from "./highlighter";

const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";

const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);
let mounted = false;
const reactor = new Reactor();

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
  if (request.message === "mount-extension") {
    const rootContainer = document.querySelector("#__root");
    if (!rootContainer) throw new Error("Can't find Content root element");
    const root = createRoot(rootContainer);
    const Iframe = () => {
      const iframeRef = React.useRef<HTMLIFrameElement>(null);

      React.useEffect(() => {
        window.document.body.addEventListener("click", async (event) => {
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
          const modifications = await reactor.pushModification(modification);
          for (const modification of modifications) {
            modification.setHighlight(true);
          }
        });

        chrome.runtime.onMessage.addListener(
          (request, _sender, sendResponse): boolean => {
            // reactor
            if (request.message === "EDITING") {
              reactor.attach(document, getHighlighter());
            }
            if (request.message === "STOP_EDITING") {
              reactor.detach();
            }
            // resize iframe
            if (iframeRef.current) {
              let styles = {};
              switch (request.message) {
                case "ANALYZING":
                case "EDITING":
                case "PLAY":
                case "RECORDING":
                  styles = {
                    bottom: "auto",
                    height: "150px",
                    top: "0px",
                    width: "400px",
                  };
                  break;
                case "MINIMIZED":
                  styles = {
                    bottom: "10px",
                    height: "100px",
                    top: "auto",
                    width: "100px",
                  };
                  break;
                default:
                  styles = {
                    bottom: "10px",
                    height: "600px",
                    top: "auto",
                    width: "500px",
                  };
              }

              // set inline styles for iframe
              Object.assign(iframeRef.current.style, styles);
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

    // avoid remounting react tree
    if (!mounted) {
      root.render(<Iframe />);
      mounted = true;
      try {
        console.debug("content script loaded, extension iframe mounted");
      } catch (e) {
        console.error(e);
      }
    }
  }
});
