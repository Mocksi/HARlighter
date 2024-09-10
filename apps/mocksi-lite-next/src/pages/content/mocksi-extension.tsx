import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
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

function getIframeSizePosition({
  height,
  position,
  width,
}: {
  height: number;
  position: string;
  width: number;
}) {
  if (!height || !width || !position) {
    console.error(
      "Cannot update iframe size / position, make sure 'request.data.iframe' has 'height', 'width', and 'position' set correctly",
    );
    return;
  }

  const bounds = document.body.getBoundingClientRect();

  const styles = {
    bottom: "auto",
    display: "block",
    height: `${height}px`,
    left: "auto",
    right: "auto",
    top: "auto",
    width: `${width}px`,
  };

  switch (position) {
    case "BOTTOM_CENTER":
      styles.bottom = "0px";
      styles.right = `${bounds.width / 2 - width / 2}px`;
      break;
    case "BOTTOM_RIGHT":
      styles.bottom = "10px";
      styles.right = "10px";
      break;
    case "NONE":
      styles.display = "none";
      break;
    case "TOP_RIGHT":
      styles.top = "10px";
      styles.right = "10px";
      break;
  }
  return styles;
}

// Function to get styles based on the message,
function getIframeStyles(message: string): Partial<CSSStyleDeclaration> {
  switch (message) {
    case "ANALYZING":
    case "PLAY":
    case "RECORDING":
      return {
        display: "block",
        height: "150px",
        inset: "0px 10px auto auto",
        width: "300px",
      };
    case "EDITING":
    case "INIT":
    case "LIST":
    case "NEW_EDIT":
    case "READYTORECORD":
    case "SETTINGS":
    case "STOP_EDITING":
    case "STOP_PLAYING":
    case "UNAUTHORIZED":
      return {
        display: "block",
        height: "600px",
        inset: "auto 10px 10px auto",
        width: "500px",
      };
    case "MINIMIZED":
      return {
        display: "none",
        inset: "0px 0px auto auto",
      };
    default:
      return {};
  }
}

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
        flags: string,
        highlight: boolean,
      ) {
        const modification: ModificationRequest = {
          description: `Change ${find} to ${replace}`,
          modifications: [
            {
              action: "replaceAll",
              content: `/${find}/${replace}/${flags}`,
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
                  const { find, flags, highlightEdits, replace } = request.data;
                  await findReplaceAll(find, replace, flags, highlightEdits);
                  data = Array.from(reactor.getAppliedModifications()).map(
                    (mod) => mod.modificationRequest,
                  );
                }
              }
              if (
                request.message === "STOP_EDITING" ||
                request.message === "STOP_PLAYING" ||
                request.message === "STOP_CHAT"
              ) {
                reactor.detach();
              }

              // chat actions
              if (request.message === "CHAT") {
                reactor.attach(document, getHighlighter());
              }
              if (request.message === "CHAT_MESSAGE") {
                data = reactor.exportDOM();
              }
              if (request.message === "CHAT_RESPONSE") {
                await reactor.pushModification(request.data);
                data = Array.from(reactor.getAppliedModifications()).map(
                  (mod) => mod.modificationRequest,
                );
              }

              // Resize iframe with the new styles
              if (iframeRef.current) {
                if (request.data?.iframe) {
                  // v1 iframe size / position pattern
                  const styles = getIframeSizePosition(request.data.iframe);
                  Object.assign(iframeRef.current.style, styles);
                } else {
                  // v0+
                  const styles = getIframeStyles(request.message);
                  Object.assign(iframeRef.current.style, styles);
                }
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
                  backgroundColor: "transparent",
                  border: "none",
                  bottom: "10px",
                  boxShadow: "none",
                  colorScheme: "light",
                  display: "block",
                  height: "600px",
                  left: "auto",
                  position: "fixed",
                  right: "10px",
                  top: "auto",
                  width: "500px",
                  zIndex: 99998,
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
