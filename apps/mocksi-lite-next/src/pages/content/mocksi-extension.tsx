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
            iframeRef.current.style.bottom = "0";
            iframeRef.current.style.top = "unset";
            iframeRef.current.style.border = "2px solid yellow";
          } else if (request.message === "sm-top") {
            iframeRef.current.style.height = "150px";
            iframeRef.current.style.width = "350px";
            iframeRef.current.style.bottom = "unset";
            iframeRef.current.style.top = "0";
            iframeRef.current.style.border = "2px solid pink";
          } else {
            // default is "lg-bottom"
            iframeRef.current.style.height = "600px";
            iframeRef.current.style.width = "500px";
            iframeRef.current.style.bottom = "0";
            iframeRef.current.style.top = "unset";
            iframeRef.current.style.border = "2px dotted green";
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
              bottom: 0,
              right: 0,
              height: "600px",
              width: "500px",
              border: "4px solid red",
              boxShadow: "none",
              zIndex: 99998,
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
