import React from "react";
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
  const [small, setSmall] = React.useState(false);

  // Switch out differently styled Iframes based on message from nest/extension,
  // swapping out the iframes themselves makes the size change
  // immediate instead of keeping the iframe and updating the styles
  // which only happens on the next render
  React.useEffect(() => {
    // @ts-expect-error
    chrome.runtime.onMessage.addListener(
      (request, _sender, sendResponse): boolean => {
        console.log("Received message in content script:", request);

        setSmall((p) => !p);

        sendResponse({ message: request.message, status: "ok" });
        return true;
      },
    );
  }, []);

  React.useEffect(() => {
    console.log("is small: ", small);
  }, [small]);

  const iframe = ReactDOM.createPortal(
    <>
      {small ? (
        <iframe
          seamless={true}
          src="http://localhost:3030/extension"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "200px",
            width: "300px",
            border: "4px dotted pink",
            boxShadow: "none",
            zIndex: 99998,
          }}
        />
      ) : (
        <iframe
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
      )}
    </>,
    document.body,
  );

  return <div>{iframe}</div>;
};

root.render(<Iframe />);

try {
  console.log("content script loaded");
} catch (e) {
  console.error(e);
}
