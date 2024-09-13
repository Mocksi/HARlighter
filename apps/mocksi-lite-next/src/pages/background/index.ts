/// <reference types="chrome" />

import { jwtDecode } from "jwt-decode";

// Constants
const MOCKSI_AUTH = "mocksi-auth";

// Interfaces
interface AuthData {
  accessToken: string;
  email: string;
}

interface Message {
  message: string;
  data?: any;
}

interface Response {
  message: string | object;
  status: string;
  error?: any; // FIXME: it should not be any
}

// State
let prevRequest: Message = { message: "INIT" };

// Auth Utilities
const getAuth = async (): Promise<AuthData | null> => {
  try {
    const result = await chrome.storage.local.get(MOCKSI_AUTH);
    return result[MOCKSI_AUTH] || null;
  } catch (err) {
    console.error("Error getting auth:", err);
    return null;
  }
};

const clearAuth = async (): Promise<void> => {
  try {
    await chrome.storage.local.set({ [MOCKSI_AUTH]: null });
  } catch (err) {
    console.error("Error clearing auth:", err);
  }
};

// Browser Utilities
const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id) {
    console.error("Cannot find active tab ID");
    // NOTE: This is a a hack to prevent errors from crashing the extension
    return { id: -1, url: "no-tab" };
  }
  return tab;
};

const showAuthTab = async (force = false): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  const authUrl = new URL(import.meta.env.VITE_NEST_APP);
  const tabExists = !force && tabs.some(tab => {
    const tabUrlStr = tab.url || tab.pendingUrl || "";
    return new URL(tabUrlStr).href === authUrl.href;
  });

  if (!tabExists) {
    await chrome.tabs.create({ url: authUrl.href });
  }
};

const setIcon = async (iconPath: string): Promise<void> => {
  await chrome.action.setIcon({ path: iconPath });
};

// Message Handlers
const handleAuthError = async (): Promise<Response> => {
  await clearAuth();
  return { message: "retry", status: "ok" };
};

const handleUnauthorized = async (): Promise<Response> => {
  const auth = await getAuth();

  // FIXME: I have a hunch that this is not the best way to handle this situation
  if (auth) {
    const tab = await getCurrentTab();
    return { message: { ...auth, url: tab?.url }, status: "ok" };
  }

  await showAuthTab(true);
  return { message: "authenticating", status: "ok" };
};

const updateIcon = async (message: string): Promise<void> => {
  switch (message) {
    case "PLAY":
      await setIcon("play-icon.png");
      break;
    case "MINIMIZED":
      // No action needed
      break;
    default:
      console.log(`Unhandled icon update for message: ${message}`);
  }
};

const handleOtherMessages = async (request: Message): Promise<Response> => {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    console.log("No active tab found, could not send message");
    return { message: request.message, status: "no-tab" };
  }

  await updateIcon(request.message);
  return { message: "processed", status: "ok" };
};


const checkAndHandleAuthRequest = async (request?: Message, sender?: chrome.runtime.MessageSender, sendResponse?: (response: Response) => void) => {
      if (!request || !sendResponse) {
        console.error("Invalid request or sendResponse");
        return false;
      }

      try {
        let response: Response;

        switch (request.message) {
          case "AUTH_ERROR":
            response = await handleAuthError();
            break;
          case "UNAUTHORIZED":
            response = await handleUnauthorized();
            break;
          default:
            response = await handleOtherMessages(request);
        }

        sendResponse(response);
      } catch (error) {
        console.error("Error processing message:", error);
        sendResponse({ message: "error", status: "error", error: String(error) });
      }

      // Update prevRequest if not minimized
      if (request.message !== "MINIMIZED") {
        prevRequest = request;
      }

      return true;
}

// Main message listener
chrome.runtime.onMessageExternal.addListener(
  (request: Message, sender, sendResponse) => {
    console.log("Previous message from external:", prevRequest);
    console.log("Received new message from external:", request);

    checkAndHandleAuthRequest(request, sender, sendResponse);

    return true; // Indicates that the response is sent asynchronously
  }
);

// Install event listener
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: import.meta.env.VITE_NEST_APP });
});

// Browser action click listener
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    console.log("No tab found, could not mount extension");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "toggleExtension" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
      return;
    }

    if (response && response.status === "ok") {
      console.log("Extension toggled successfully");
    } else {
      console.error("Failed to toggle extension:", response);
    }
  });
});

const checkAndHandleAuth = async () => {
  const auth = await getAuth();
  if (!auth) {
    console.log("No auth token found");
    return;
  }

  const decodedToken: any = jwtDecode(auth.accessToken);
  const currentTime = Math.floor(Date.now() / 1000);

  if (!decodedToken.exp || decodedToken.exp >= currentTime) {
    console.log("Valid auth token found");
    return;
  }

  console.log("Token expired, clearing auth");
  await clearAuth();
};

const initialize = async () => {
  try {
    await checkAndHandleAuth();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
};

// Call the initialization function
initialize();
