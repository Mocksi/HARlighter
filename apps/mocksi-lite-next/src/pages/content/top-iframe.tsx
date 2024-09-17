import { AppEvents, DemoEditEvents } from "@pages/events";
import React from "react";
import ReactDOM from "react-dom";

function TopIframe() {
  const [show, setShow] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    chrome.runtime.onMessage.addListener((request, _sender) => {
      // execute in async block so that we return true
      // synchronously, telling chrome to wait for the response
      (async () => {
        if (request.message === AppEvents.EDIT_DEMO_START) {
          setShow(true);
        }

        if (
          request.message === AppEvents.EDIT_DEMO_STOP ||
          request.message.PLAY_DEMO_START
        ) {
          setShow(false);
        }
        if (iframeRef.current) {
          const bounds = document.body.getBoundingClientRect();
          if (request.message === DemoEditEvents.HIDE_TOOLBAR) {
            const width = 65;
            Object.assign(iframeRef.current.style, {
              height: "35px",
              right: `${bounds.width / 2 - width / 2}px`,
              width: `${width}px`,
            });
          }
          if (request.message === DemoEditEvents.SHOW_TOOLBAR) {
            Object.assign(iframeRef.current.style, {
              height: "80px",
              right: "auto",
              width: "100vw",
            });
          }
        }
      })();
      return true;
    });
  }, []);

  return ReactDOM.createPortal(
    <iframe
      ref={iframeRef}
      seamless={true}
      src={`${import.meta.env.VITE_NEST_APP}/extension/top`}
      style={{
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
        colorScheme: "light",
        display: show ? "block" : "none",
        height: "80px",
        position: "fixed",
        top: "0px",
        width: "100vw",
        zIndex: 99998,
      }}
    />,
    document.body,
  );
}

export default TopIframe;
