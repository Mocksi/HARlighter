import { ActionType } from "src/services/background_interactor";
import { sendToBackground } from "src/services/background_interactor";

type SerializableTargetInfo = {
  eventType?: string;
  tagName?: string;
  id?: string;
  className?: string;
  attributes?: { [key: string]: string };
};

// Helper function to convert an event's target to a JSON string
function stringifyEventTarget(event: Event): string {
  // Initialize an empty object for storing serializable info
  const targetInfo: SerializableTargetInfo = {};

  // Store the event type
  targetInfo.eventType = event.type;

  // Ensure the event.target exists and is a DOM element
  if (event.target && event.target instanceof Element) {
    targetInfo.tagName = (event.target as Element).tagName; // Tag name of the element
    targetInfo.id = (event.target as Element).id; // ID of the element
    targetInfo.className = (event.target as Element).className; // Class names of the element

    // Collect attributes in a serializable object
    targetInfo.attributes = Array.from(
      (event.target as Element).attributes,
    ).reduce((attrs, attr) => {
      attrs[attr.name] = attr.value;
      return attrs;
    }, {});
  }

  // Convert the target info object to a JSON string
  return JSON.stringify(targetInfo);
}

function sendTagsToServer() {
  const scriptTags = document.querySelectorAll("script");
  // Loop through scriptTags and access their attributes (e.g., src)
  // biome-ignore lint/complexity/noForEach: <explanation>
  scriptTags.forEach((scriptTag) => {
    let target = scriptTag.src
    if (target.length < 1) {
        target = scriptTag.innerHTML || scriptTag.innerText || "";
    }
    if (target === "") {
        return;
    }
    const payload = {
      event_type: "script_tag_found",
      target,
    };
    sendToBackground(JSON.stringify(payload), ActionType.HTMLTags);
  });

  const linkTags = document.querySelectorAll("link");
  // Loop through linkTags and access their attributes (e.g., href)
  // biome-ignore lint/complexity/noForEach: <explanation>
  linkTags.forEach((linkTag) => {
    const linkHref = linkTag.href;
    const payload = {
      event_type: "link_tag_found",
      target: linkHref,
    };
    sendToBackground(JSON.stringify(payload), ActionType.HTMLTags);
  });
}

document.addEventListener("click", (event: MouseEvent) => {
  const payload = {
    event_type: event.type,
    target: stringifyEventTarget(event),
  };
  sendToBackground(JSON.stringify(payload), ActionType.Click);
});

document.addEventListener("DOMContentLoaded", () => {
  const payload = {
    event_type: "DOMContentLoaded",
    target: document.location.href,
  };
  sendToBackground(JSON.stringify(payload), ActionType.DOMContentLoaded);
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
  const payload = {
    event_type: event.type,
    target: stringifyEventTarget(event),
  };
  sendToBackground(JSON.stringify(payload), ActionType.KeyboardEvent);
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    sendTagsToServer();
    const addedNodes = Array.from(mutation.addedNodes);
    for (const node of addedNodes) {
      if (node instanceof HTMLInputElement && node.type === "text") {
        node.addEventListener("input", () => {
          // FIXME: add debounce
          sendToBackground(node.value, ActionType.Input);
        });
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
