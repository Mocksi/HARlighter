import { AppliedModifications, Reactor } from "@repo/reactor";
import type { ModificationRequest } from "@repo/reactor";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { getHighlighter } from "./highlighter";

const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";

const div = document.createElement("div");
div.id = "__mocksi__root";
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
    const rootContainer = document.querySelector("#__mocksi__root");
    if (!rootContainer) throw new Error("Can't find Content root element");
    const root = createRoot(rootContainer);
    const Iframe = () => {
      const iframeRef = React.useRef<HTMLIFrameElement>(null);

      async function findReplaceAll(
        find: string,
        replace: string,
        highlight: boolean,
      ) {
        const modification: ModificationRequest = {
          description: `Change ${find} to ${replace}`,
          modifications: [
            {
              action: "replaceAll",
              content: `/${find}/${replace}/`,
              selector: "body",
            },
          ],
        };

        const modifications = await reactor.pushModification(modification);
        if (highlight) {
          for (const mod of modifications) {
            mod.setHighlight(true);
          }
        }
        console.log("mods in find and replace fn: ", modifications);
        return modifications;
      }

      React.useEffect(() => {
        chrome.runtime.onMessage.addListener(
          (request, _sender, sendResponse) => {
            // execute in async block so that we return true
            // synchronously, telling chrome to wait for the response
            (async () => {
              let data = null;

              // reactor
              if (request.message === "EDITING" || request.message === "PLAY") {
                for (const mod of request.data.edits) {
                  await reactor.pushModification(mod);
                }
                reactor.attach(document, getHighlighter());
              }
              if (request.message === "NEW_EDIT") {
                if (request.data) {
                  const { find, highlightEdits, replace } = request.data;
                  await findReplaceAll(find, replace, highlightEdits);
                  data = Array.from(reactor.getAppliedModifications()).map(
                    (mod) => mod.modificationRequest,
                  );
                }
              }
              if (
                request.message === "STOP_EDITING" ||
                request.message === "STOP_PLAYING"
              ) {
                reactor.detach();
              }
              // resize iframe
              if (iframeRef.current) {
                let styles = {};
                switch (request.message) {
                  case "ANALYZING":
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

              sendResponse({
                data,
                message: request.message,
                status: "ok",
              });
            })();
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
                src={`${import.meta.env.VITE_NEST_APP}/extension`}
                style={{
                  colorScheme: "light",
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

    try {
      if (!mounted) {
        root.render(<Iframe />);
        mounted = true;
      }
      console.debug("content script loaded, extension iframe mounted");
    } catch (e) {
      console.error(e);
    }
  }
});
