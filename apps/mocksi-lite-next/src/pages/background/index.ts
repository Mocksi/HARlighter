console.log("background script loaded");
const MOCKSI_AUTH = "mocksi-auth";

const getAuth = async (): Promise<null | {
  accessToken: string;
  email: string;
}> => {
  try {
    const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
    const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
    return mocksiAuth;
  } catch (err) {
    console.error(err);
    return null;
  }
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

function showAuthTab() {
  return new Promise((resolve: (value?: unknown) => void) => {
    chrome.tabs.query({}, function (tabs) {
      let tabExists = false;
      for (const tab of tabs) {
        const tabUrlStr = tab.url || tab.pendingUrl || "";
        const loadUrl = new URL(import.meta.env.VITE_NEST_APP);
        const tabUrl = new URL(tabUrlStr);
        if (loadUrl.href === tabUrl.href) {
          tabExists = true;
          break;
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
  } else {
    console.log("No tab found, could not mount extension");
  }
});

chrome.runtime.onMessage.addListener(
  (request, _sender, sendResponse): boolean => {
    console.log("Received message:", request);
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
    console.log("Received message from external:", request);

    // execute in async block so that we return true
    // synchronously, telling chrome to wait for the response
    (async () => {
      if (request.message === "UNAUTHORIZED") {
        const auth = await getAuth();
        if (auth) {
          const { accessToken, email } = auth;
          const tab = await getCurrentTab();
          sendResponse({
            message: { accessToken, email, url: tab.url },
            status: "ok",
          });
        } else {
          await showAuthTab();
          sendResponse({
            message: "authenticating",
            status: "ok",
          });
        }
      } else if (request.message === "AUTH_ERROR") {
        await clearAuth();
        await showAuthTab();
        sendResponse({
          message: "authenticating",
          status: "ok",
        });
      } else {
        const tab = await getCurrentTab();
        if (!tab.id) {
          sendResponse({ message: request.message, status: "no-tab" });
          console.log("No active tab found, could not send message");
          return;
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
