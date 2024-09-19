import type { ModificationRequest } from "@repo/reactor";
import { Reactor } from "@repo/reactor";
import React from "react";
import { createRoot } from "react-dom/client";
import { DemoEditEvents, LayoutEvents } from "../events";
import { getHighlighter } from "./highlighter";
import MainIframe from "./main-iframe";
import TopIframe from "./top-iframe";

const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";

const div = document.createElement("div");
div.id = "__mocksi__root";
document.body.appendChild(div);

let mounted = false;

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

interface AppMessageRequest {
  data: {
    edits?: ModificationRequest[];
    uuid: string;
  };
  message: string;
}

function Extension() {
  const prevStartStopDemoEventRef = React.useRef({
    data: { uuid: "" },
    message: "",
  });

  const reactor = new Reactor();
  const highlighter = getHighlighter();

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
        console.log("request in mocksi-extension from background: ", request);
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

        if (request.message === DemoEditEvents.UNDO) {
          await reactor.popModification();
          data = Array.from(reactor.getAppliedModifications()).map(
            (mod) => mod.modificationRequest,
          );
        }

        // send response back to background which forwards it to extension/x
        sendResponse({
          data,
          message: request.message,
          source: "reactor",
          status: "ok",
        });
      })();
      return true;
    });
  }, []);
  return (
    <>
      <TopIframe />
      <MainIframe />
    </>
  );
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === LayoutEvents.MOUNT) {
    const rootContainer = document.querySelector("#__mocksi__root");
    if (!rootContainer) {
      throw new Error("Can't find Content root element");
    }

    const root = createRoot(rootContainer);

    // avoid remounting react tree
    try {
      if (!mounted) {
        root.render(<Extension />);
        mounted = true;
      }
      console.debug("content script loaded, extension iframe mounted");
    } catch (e) {
      console.error(e);
    }
  }
});
