import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { AppEvents, DemoEditEvents, ExtHarnessEvents } from "../events";
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

const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";

const div = document.createElement("div");
div.id = "__mocksi__root";
document.body.appendChild(div);

let mounted = false;
const reactor = new Reactor();
const highlighter = getHighlighter();

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

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === ExtHarnessEvents.MOUNT) {
    const rootContainer = document.querySelector("#__mocksi__root");
    if (!rootContainer) throw new Error("Can't find Content root element");

    const root = createRoot(rootContainer);
    const Iframe = () => {
      const prevAppEvent = React.useRef({ data: { uuid: "" }, message: "" });
      const iframeRef = React.useRef<HTMLIFrameElement>(null);

      async function findReplaceAll(
        find: string,
        replace: string,
        flags: string,
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
        return modifications;
      }

      async function startDemo(request: AppMessageRequest) {
        if (!request.data.edits) {
          console.debug("request did not contain edits");
          return;
        }
        for (const mod of request.data.edits) {
          await reactor.pushModification(mod);
        }
        return await reactor.attach(document, highlighter);
      }

      React.useEffect(() => {
        chrome.runtime.onMessage.addListener(
          (request, _sender, sendResponse) => {
            // execute in async block so that we return true
            // synchronously, telling chrome to wait for the response
            (async () => {
              let data = null;

              // check if app is asking to start or stop PLAY or EDIT
              const startRequestRegExp = new RegExp(/_DEMO_START/);
              const stopRequestRegExp = new RegExp(/_DEMO_STOP/);

              const requestingStopDemo = stopRequestRegExp.test(
                request.message,
              );
              const requestingStartDemo = startRequestRegExp.test(
                request.message,
              );

              // if a demo is running already we want to avoid mounting the same
              // modifications more than once, this is more performant, and edits
              // persist in the dom if transitioning between EDIT and PLAY states
              if (requestingStartDemo) {
                const prevDemoUUID = prevAppEvent.current?.data?.uuid || null;

                const demoRunning =
                  prevDemoUUID &&
                  startRequestRegExp.test(prevAppEvent.current.message);

                if (!demoRunning) {
                  await startDemo(request);
                } else {
                  const isDupeEvent =
                    prevAppEvent.current.message === request.message;

                  const isNewDemo = prevDemoUUID !== request.data.uuid;

                  const hasMods = request.data.edits.length > 0;

                  if (!isDupeEvent && isNewDemo && hasMods) {
                    if (reactor.isAttached()) {
                      await reactor.detach(true);
                    }
                    await startDemo(request);
                  }
                }
              }

              if (
                request.message === AppEvents.EDIT_DEMO_STOP ||
                request.message === AppEvents.PLAY_DEMO_STOP
              ) {
                await reactor.detach(true);
              }

              // save last app event to check if we can keep mods in dom
              if (requestingStartDemo || requestingStopDemo) {
                prevAppEvent.current = request;
              }

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
                  case ExtHarnessEvents.HIDE:
                    iframeRef.current.style.display = "none";
                    break;
                  case ExtHarnessEvents.SHOW:
                    iframeRef.current.style.display = "block";
                    break;
                  case ExtHarnessEvents.RESIZE:
                    const styles = getIframeStyles(request.data.iframe);
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
