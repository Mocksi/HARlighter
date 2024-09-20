import {
  AppEvents,
  AuthEvents,
  DemoEditEvents,
  LayoutEvents,
} from "@pages/events";
import { jwtDecode } from "jwt-decode";

console.log("background script loaded");

const MOCKSI_AUTH = "mocksi-auth";

let fallbackTab: null | chrome.tabs.Tab = null;
let prevLayoutEvent = "";

const getAuth = async (): Promise<null | {
  accessToken: string;
  email: string;
}> => {
  try {
    const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
    if (!storageAuth[MOCKSI_AUTH]) {
      return null;
    }
    const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
    const jwtPayload = jwtDecode(mocksiAuth.accessToken);
    const isExpired = jwtPayload.exp && Date.now() >= jwtPayload.exp * 1000;

    if (isExpired) {
      console.log("token expired, clearing chrome storage");
      await clearAuth();
      return null;
    }
    return mocksiAuth;
  } catch (err) {
    console.error(err);
  }
  return null;
};

const clearAuth = async (): Promise<void> => {
  try {
    const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
    storageAuth[MOCKSI_AUTH] = null;
  } catch (err) {
    console.error(err);
  }
};

async function getCurrentTab() {
  const queryOptions: chrome.tabs.QueryInfo = {
    active: true,
    lastFocusedWindow: true,
    windowType: "normal",
  };

  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  const tabs = await chrome.tabs.query(queryOptions);
  if (!tabs[0] && !fallbackTab) {
    console.error("tab is undefined");
    return null;
  }
  if (tabs[0]) {
    fallbackTab = tabs[0];
    return tabs[0];
  } else {
    return fallbackTab;
  }
}

async function showAuthTab(force?: boolean) {
  return new Promise(async (resolve: (value?: unknown) => void) => {
    chrome.tabs.query({}, function (tabs) {
      let tabExists = false;
      if (!force) {
        for (const tab of tabs) {
          const tabUrlStr = tab.url || tab.pendingUrl || "";
          const loadUrl = new URL(import.meta.env.VITE_NEST_APP);
          const tabUrl = new URL(tabUrlStr);
          if (loadUrl.href === tabUrl.href) {
            tabExists = true;
            break;
          }
        }
      }

      if (!tabExists) {
        chrome.tabs.create({ url: import.meta.env.VITE_NEST_APP }, resolve);
      } else {
        resolve();
      }
    });
  });
}

async function showDefaultIcon(tabId: number) {
  await chrome.action.setIcon({
    path: "mocksi-icon.png",
    tabId: tabId,
  });
}

async function showPlayIcon(tabId: number) {
  await chrome.action.setIcon({
    path: "play-icon.png",
    tabId: tabId,
  });
}

addEventListener("install", () => {
  // TODO test if this works on other browsers
  chrome.tabs.create({
    url: import.meta.env.VITE_NEST_APP,
  });
});

let mainIframeSrcPort: null | chrome.runtime.Port = null;
let topIframeSrcPort: null | chrome.runtime.Port = null;

chrome.runtime.onConnectExternal.addListener((port) => {
  console.log("connecting...", port);
  if (port.name === "extension/main") {
    mainIframeSrcPort = port;
  }
  if (port.name === "extension/top") {
    topIframeSrcPort = port;
  }
});

// when user clicks toolbar mount extension
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    console.log("No tab  exits click, could not mount extension");
    return;
  }
  // store the tab they clicked on to open the extension
  // so we can use it as a fallback
  fallbackTab = tab;

  chrome.tabs.sendMessage(tab.id, {
    message: LayoutEvents.MOUNT,
  });

  if (prevLayoutEvent === LayoutEvents.HIDE) {
    chrome.tabs.sendMessage(tab.id, {
      message: LayoutEvents.SHOW,
    });
    prevLayoutEvent = LayoutEvents.HIDE;
  }
});

chrome.runtime.onMessageExternal.addListener(
  (request, _sender, sendResponse) => {
    console.log("on message external: ", request);

    // execute in async block so that we return true
    // synchronously, telling chrome to wait for the response
    (async () => {
      if (
        request.source === "extension/top" &&
        request.message === AppEvents.EDIT_DEMO_STOP
      ) {
        if (mainIframeSrcPort) {
          // notify extension/main that demo edit mode exited in extension/top
          mainIframeSrcPort.postMessage({
            ...request,
            message: AppEvents.EDIT_DEMO_STOP,
          });
        } else {
          console.log("mainIframeSrcPort is not connected");
        }
      }

      if (request.message === AuthEvents.AUTH_ERROR) {
        await clearAuth();
        sendResponse({
          message: AuthEvents.RETRY,
          source: "background",
          status: "ok",
        });
      } else if (request.message === AuthEvents.UNAUTHORIZED) {
        const auth = await getAuth();
        if (auth) {
          const { accessToken, email } = auth;
          const tab = await getCurrentTab();
          sendResponse({
            message: { accessToken, email, url: tab?.url },
            source: "background",
            status: "ok",
          });
        } else {
          await showAuthTab(true);
          sendResponse({
            message: AuthEvents.AUTHENTICATING,
            source: "background",
            status: "ok",
          });
        }
      } else {
        const tab = await getCurrentTab();
        if (!tab?.id) {
          sendResponse({
            message: LayoutEvents.NO_TAB,
            source: "background",
            status: "ok",
          });
          console.error("No tab found");
          return true;
        }

        if (
          request.message === LayoutEvents.HIDE ||
          request.message === LayoutEvents.RESIZE ||
          request.message === LayoutEvents.SHOW
        ) {
          prevLayoutEvent = request.message;
        }

        if (request.message === AppEvents.PLAY_DEMO_START) {
          showPlayIcon(tab?.id);
        }

        if (
          request.message === AppEvents.PLAY_DEMO_STOP ||
          request.message === AppEvents.EDIT_DEMO_START ||
          request.message === AppEvents.EDIT_DEMO_STOP
        ) {
          showDefaultIcon(tab.id);
        }

        // send message to iframes and reactor in mocksi-extension
        chrome.tabs.sendMessage(tab.id, request, async (response) => {
          console.log("response from content script in background:", response);
          if (response.message === DemoEditEvents.UNDO) {
            // pass updated modifications from reactor to extension/main to store
            if (mainIframeSrcPort) {
              await mainIframeSrcPort.postMessage({
                ...response,
                status: "ok", // response handler expects status
              });
            } else {
              console.log("mainIframeSrcPort is not connected");
            }
          }
          if (
            request.message === AppEvents.EDIT_DEMO_START ||
            request.message === DemoEditEvents.NEW_EDIT ||
            request.message === DemoEditEvents.CHAT_RESPONSE
          ) {
            // notify extension/top # of edits changed
            if (topIframeSrcPort) {
              await topIframeSrcPort.postMessage({
                ...response,
                status: "ok",
              });
            } else {
              console.log("topIframeSrcPort is not connected");
            }
          }

          sendResponse(response);
        });
        return true;
      }
    })();

    return true;
  },
);
