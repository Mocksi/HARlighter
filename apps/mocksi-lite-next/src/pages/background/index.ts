console.log("background script loaded");

const getAuth = async (): Promise<null | {
  accessToken: string;
  email: string;
}> => {
  const MOCKSI_AUTH = "mocksi-auth";
  try {
    const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
    const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
    return mocksiAuth;
  } catch (err) {
    console.error(err);
    return null;
  }
};

addEventListener("install", () => {
  // TODO test if this works on other browsers
  chrome.tabs.create({
    url: "https://nest-auth-ts-merge.onrender.com",
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
    sendResponse({ message: request.message, status: "ok" });
    return true;
  },
);

chrome.runtime.onMessageExternal.addListener(
  async (request, _sender, sendResponse) => {
    console.log("Received message from external:", request);

    if (request.message === "UNAUTHORIZED") {
      const auth = await getAuth();
      if (auth) {
        const { accessToken, email } = auth;
        sendResponse({
          message: { accessToken, email },
          status: "ok",
        });
      } else {
        chrome.tabs.create({
          url: "https://nest-auth-ts-merge.onrender.com",
        });
        sendResponse({
          message: "authenticating",
          status: "ok",
        });
      }
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { message: request.message });
        } else {
          console.log("No active tab found, could not send message");
        }
      });
      sendResponse({ message: request.message, status: "ok" });
      return true;
    }
  },
);
