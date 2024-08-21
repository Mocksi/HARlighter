<<<<<<< HEAD
=======
import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
>>>>>>> origin/main
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { getHighlighter } from "./highlighter";

const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);
let mounted = false;

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "mount-extension") {
    const rootContainer = document.querySelector("#__root");
    if (!rootContainer) throw new Error("Can't find Content root element");
    const root = createRoot(rootContainer);
    const Iframe = () => {
      const iframeRef = React.useRef<HTMLIFrameElement>(null);

      React.useEffect(() => {
        chrome.runtime.onMessage.addListener(
          (request, _sender, sendResponse): boolean => {
            if (iframeRef.current) {
              let styles = {};
              switch (request.message) {
                case "EDITING":
                case "PLAY":
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
