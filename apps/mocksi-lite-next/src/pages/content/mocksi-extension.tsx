import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

const div = document.createElement("div");
div.id = "__root";
// @ts-ignore
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);

const Iframe = () => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [iframeSize, setIframeSize] = React.useState("lg-bottom");

  // Switch out differently styled Iframes based on message from nest/extension,
  // swapping out the iframes themselves makes the size change
  // immediate instead of keeping the iframe and updating the styles
  // which only happens on the next render
  React.useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (request, _sender, sendResponse): boolean => {
        console.log("Received message in content script:", request);

        setIframeSize(request.message);

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
