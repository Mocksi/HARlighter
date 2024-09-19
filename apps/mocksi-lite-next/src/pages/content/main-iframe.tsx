import React from "react";
import ReactDOM from "react-dom";
import { LayoutEvents } from "../events";

export enum IframePosition {
  BOTTOM_CENTER = "BOTTOM_CENTER",
  TOP_RIGHT = "TOP_RIGHT",
  BOTTOM_RIGHT = "BOTTOM_RIGHT",
}

export interface IframeResizeArgs {
  height: number;
  id?: string;
  position:
    | IframePosition.BOTTOM_CENTER
    | IframePosition.BOTTOM_RIGHT
    | IframePosition.TOP_RIGHT;
  width: number;
}

function getIframeStyles({ height, position, width }: IframeResizeArgs) {
  if (!height || !width || !position) {
    console.error(
      "Cannot update iframe size / position, make sure 'request.data.iframe' has 'height', 'width', and 'position' set correctly",
    );
    return;
  }

  const bounds = document.body.getBoundingClientRect();

  let styles = {};
  switch (position) {
    case IframePosition.BOTTOM_CENTER:
      styles = {
        bottom: "0px",
        right: `${bounds.width / 2 - width / 2}px`,
        top: "auto",
      };
      break;
    case IframePosition.BOTTOM_RIGHT:
      styles = {
        bottom: "10px",
        right: "10px",
        top: "auto",
      };
      break;
    case IframePosition.TOP_RIGHT:
      styles = {
        bottom: "auto",
        display: "block",
        right: "10px",
        top: "10px",
      };
      break;
  }

  return Object.assign(
    {
      bottom: "auto",
      display: "block",
      height: `${height}px`,
      left: "auto",
      right: "auto",
      top: "auto",
      width: `${width}px`,
    },
    styles,
  );
}

function MainIframe() {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    chrome.runtime.onMessage.addListener((request) => {
      if (iframeRef.current) {
        switch (request.message) {
          case LayoutEvents.HIDE:
            iframeRef.current.style.display = "none";
            break;
          case LayoutEvents.RESIZE:
            const styles = getIframeStyles(request.data.iframe);
            Object.assign(iframeRef.current.style, styles);
            break;
          case LayoutEvents.SHOW:
            iframeRef.current.style.display = "block";
            break;
        }
      }
      return true;
    });
  }, []);

  return (
    <>
      {ReactDOM.createPortal(
        <iframe
          ref={iframeRef}
          seamless={true}
          src={`${import.meta.env.VITE_NEST_APP}/extension/main`}
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
        />,
        document.body,
      )}
    </>
  );
}

export default MainIframe;
