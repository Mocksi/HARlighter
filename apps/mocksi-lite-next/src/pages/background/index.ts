import { jwtDecode } from "jwt-decode";

console.log("background script loaded");

const MOCKSI_AUTH = "mocksi-auth";
let prevRequest = {
  data: {},
  message: "INIT",
};

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
  const queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
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

addEventListener("install", () => {
  // TODO test if this works on other browsers
  chrome.tabs.create({
    url: import.meta.env.VITE_NEST_APP,
  });
});

// when user clicks toolbar mount extension
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { message: "mount-extension" });
    if (prevRequest.message) {
      chrome.tabs.sendMessage(tab.id, {
        data: prevRequest.data,
        message: prevRequest.message,
      });
    }
    if (prevRequest.message === "PLAY") {
      chrome.action.setIcon({
        path: "play-icon.png",
        tabId: tab.id,
      });
    }
  } else {
    console.log("No tab found, could not mount extension");
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
    // This logging is useful and only shows up in the service worker
    console.log(" ");
    console.log("Previous message from external:", prevRequest);
    console.log("Received new message from external:", request);

    // execute in async block so that we return true
    // synchronously, telling chrome to wait for the response
    (async () => {
      if (request.message === "AUTH_ERROR") {
        await clearAuth();
        sendResponse({
          message: "retry",
          status: "ok",
        });
      } else if (request.message === "UNAUTHORIZED") {
        const auth = await getAuth();
        if (auth) {
          const { accessToken, email } = auth;
          const tab = await getCurrentTab();
          sendResponse({
            message: { accessToken, email, url: tab.url },
            status: "ok",
          });
        } else {
          await showAuthTab(true);
          sendResponse({
            message: "authenticating",
            status: "ok",
          });
        }
      } else {
        const tab = await getCurrentTab();
        if (!tab.id) {
          sendResponse({ message: request.message, status: "no-tab" });
          console.log("No active tab found, could not send message");
          return true;
        }

        if (request.message === "PLAY") {
          await chrome.action.setIcon({
            path: "play-icon.png",
            tabId: tab.id,
          });
        } else if (request.message !== "MINIMIZED") {
          chrome.action.setIcon({
            path: "mocksi-icon.png",
            tabId: tab.id,
          });
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

    // Store last app state so we can return to the correct state when the
    // menu is reopened
    if (request.message !== "MINIMIZED") {
      prevRequest = request;
    }
    return true;
  },
);
