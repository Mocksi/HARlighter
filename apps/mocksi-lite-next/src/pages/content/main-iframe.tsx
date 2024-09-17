import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
import React from "react";
import ReactDOM from "react-dom";
import { DemoEditEvents, LayoutEvents } from "../events";
import { getHighlighter } from "./highlighter";

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

interface AppMessageRequest {
  data: {
    edits?: ModificationRequest[];
    uuid: string;
  };
  message: string;
}

function MainIframe() {
  const prevStartStopDemoEventRef = React.useRef({
    data: { uuid: "" },
    message: "",
  });
  const reactor = new Reactor();
  const highlighter = getHighlighter();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  async function handleStartStopDemoEvent(
    prevRequest: AppMessageRequest,
    request: AppMessageRequest,
  ) {
    async function startDemo(request: AppMessageRequest) {
      if (request.data.edits?.length) {
        for (const mod of request.data.edits) {
          await reactor.pushModification(mod);
        }
      } else {
        console.log("no edits provided to reactor");
      }
      return await reactor.attach(document, highlighter);
    }

    // check if app is asking to start or stop PLAY or EDIT
    const startRequestRegExp = new RegExp(/_DEMO_START/);
    const stopRequestRegExp = new RegExp(/_DEMO_STOP/);

    const requestingStopDemo = stopRequestRegExp.test(request.message);
    const requestingStartDemo = startRequestRegExp.test(request.message);

    if (!requestingStartDemo && !requestingStopDemo) {
      return prevRequest;
    }

    // if a demo is running already we want to avoid mounting the same
    // modifications more than once, this is more performant, and edits
    // persist in the dom if transitioning between EDIT and PLAY states
    if (requestingStartDemo) {
      const prevDemoUUID = prevRequest?.data?.uuid || null;

      const demoRunning =
        prevDemoUUID && startRequestRegExp.test(prevRequest.message);

      if (!demoRunning) {
        await startDemo(request);
      } else {
        const isDupeEvent = prevRequest.message === request.message;
        const isNewDemo = prevDemoUUID !== request.data.uuid;
        if (!isDupeEvent && isNewDemo) {
          if (reactor.isAttached()) {
            await reactor.detach(true);
          }
          await startDemo(request);
        }
      }
    }

    if (requestingStopDemo) {
      await reactor.detach(true);
    }

    return request;
  }

  async function findReplaceAll(find: string, replace: string, flags: string) {
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
    return modifications;
  }

  React.useEffect(() => {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      // execute in async block so that we return true
      // synchronously, telling chrome to wait for the response
      (async () => {
        let data = null;

        prevStartStopDemoEventRef.current = await handleStartStopDemoEvent(
          prevStartStopDemoEventRef.current,
          request,
        );

        if (request.message === DemoEditEvents.NEW_EDIT) {
          if (request.data) {
            const { find, flags, replace } = request.data;
            await findReplaceAll(find, replace, flags);
            data = Array.from(reactor.getAppliedModifications()).map(
              (mod) => mod.modificationRequest,
            );
          }
        }

        // chat events
        if (request.message === DemoEditEvents.CHAT_MESSAGE) {
          data = reactor.exportDOM();
        }

        if (request.message === DemoEditEvents.CHAT_RESPONSE) {
          await reactor.pushModification(request.data);
          data = Array.from(reactor.getAppliedModifications()).map(
            (mod) => mod.modificationRequest,
          );
        }

        // Resize iframe, how or hide it
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

        sendResponse({
          data,
          message: request.message,
          status: "ok",
        });
      })();
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
