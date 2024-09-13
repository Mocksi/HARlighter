import { AppEvents, AuthEvents, ExtHarnessEvents } from "@pages/events";
import { jwtDecode } from "jwt-decode";

console.log("background script loaded");

const MOCKSI_AUTH = "mocksi-auth";

let prevAppEvent = "";
let prevExtHarnessEvent = "";
let currentTab = null;
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
  if (tabs[0]) {
    currentTab = tabs[0];
    return tabs[0];
  } else {
    // @ts-ignore
    return currentTab;
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

// when user clicks toolbar mount extension
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    console.log("No tab found, could not mount extension");
    return;
  }

  currentTab = tab;

  chrome.tabs.sendMessage(tab.id, {
    message: ExtHarnessEvents.MOUNT,
  });

  if (prevExtHarnessEvent === ExtHarnessEvents.HIDE) {
    if (prevAppEvent === AppEvents.PLAY_DEMO_START) {
      showPlayIcon(tab.id);
    }
    chrome.tabs.sendMessage(tab.id, {
      message: ExtHarnessEvents.SHOW,
    });
  }
});

chrome.runtime.onMessage.addListener(
  (request, _sender, sendResponse): boolean => {
    sendResponse({
      data: request.data,
      message: request.message,
      status: "ok",
    });
    return true;
  },
);

chrome.runtime.onMessageExternal.addListener(
  (request, _sender, sendResponse) => {
    console.log(request);

    // execute in async block so that we return true
    // synchronously, telling chrome to wait for the response
    (async () => {
      if (request.message === AuthEvents.AUTH_ERROR) {
        await clearAuth();
        sendResponse({
          message: AuthEvents.RETRY,
          status: "ok",
        });
      } else if (request.message === AuthEvents.UNAUTHORIZED) {
        const auth = await getAuth();
        if (auth) {
          const { accessToken, email } = auth;
          const tab = await getCurrentTab();

          sendResponse({
            message: { accessToken, email, url: tab?.url },
            status: "ok",
          });
        } else {
          await showAuthTab(true);
          sendResponse({
            message: AuthEvents.AUTHENTICATING,
            status: "ok",
          });
        }
      } else {
        const tab = await getCurrentTab();
        if (!tab?.id) {
          sendResponse({
            message: request.message,
            status: ExtHarnessEvents.NO_TAB,
          });
          console.log("No active tab found, could not send message");
          return true;
        }

        switch (request.message) {
          case AppEvents.EDIT_DEMO_START:
          case AppEvents.EDIT_DEMO_STOP:
          case AppEvents.PLAY_DEMO_START:
          case AppEvents.PLAY_DEMO_STOP:
            prevAppEvent = request.message;
            break;
          case ExtHarnessEvents.HIDE:
          case ExtHarnessEvents.RESIZE:
          case ExtHarnessEvents.SHOW:
            prevExtHarnessEvent = request.message;
            break;
        }

        if (request.message === AppEvents.PLAY_DEMO_START) {
          showPlayIcon(tab.id);
        }

        if (
          request.message === AppEvents.PLAY_DEMO_STOP ||
          request.message === AppEvents.EDIT_DEMO_START ||
          request.message === AppEvents.EDIT_DEMO_STOP
        ) {
          showDefaultIcon(tab.id);
        }

        chrome.tabs.sendMessage(
          tab.id,
          {
            data: request.data,
            message: request.message,
          },
          (response) => {
            sendResponse(response);
          },
        );
      }
    })();

    return true;
  },
);
