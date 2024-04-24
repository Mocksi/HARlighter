function nowTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function sendToBackground(data: string, dataType: string) {
  if (!data || !document) {
    return;
  }
  const jsonHolder = document.createElement("script");
  jsonHolder.type = "application/json";
  jsonHolder.id = "jsonHolder";
  const timestamp = nowTimestamp();
  const payload = { dataType, data: data, timestamp }

  const b64encoded = btoa(JSON.stringify(payload)) as string;

  try {
    jsonHolder.src = b64encoded;
  } catch (e) {
    console.log(e);
    return;
  }
  (document.head || document.documentElement).appendChild(jsonHolder);
  if (document.defaultView) {
    const view = Object.assign({}, document.defaultView);
    const event = new CustomEvent("wrapperToBackground", { detail: view });
    document.dispatchEvent(event);
  } else {
    console.error("Default view is not available");
  }
}

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
    targetInfo.attributes = Array.from((event.target as Element).attributes).reduce((attrs, attr) => {
      attrs[attr.name] = attr.value;
      return attrs;
    }, {});
  }

  // Convert the target info object to a JSON string
  return JSON.stringify(targetInfo);
}

function sendTagsToServer() {
  const scriptTags = document.querySelectorAll('script');
  // Loop through scriptTags and access their attributes (e.g., src)
  // biome-ignore lint/complexity/noForEach: <explanation>
    scriptTags.forEach((scriptTag) => {
    const scriptSrc = scriptTag.src;
    const payload = {
      event_type: "script_tag_found",
      target: scriptSrc,
    };
    sendToBackground(JSON.stringify(payload), "tags");
  });

  const linkTags = document.querySelectorAll('link');
  // Loop through linkTags and access their attributes (e.g., href)
  // biome-ignore lint/complexity/noForEach: <explanation>
    linkTags.forEach((linkTag) => {
    const linkHref = linkTag.href;
    const payload = {
      event_type: "link_tag_found",
      target: linkHref,
    };
    sendToBackground(JSON.stringify(payload), "tags");
  });
}


document.addEventListener("click", (event: MouseEvent) => {
  const payload = {
    event_type: event.type,
    target: stringifyEventTarget(event),
  };
  sendToBackground(JSON.stringify(payload), "click");
});

document.addEventListener("DOMContentLoaded", () => {
  const payload = {
    event_type: "DOMContentLoaded",
    target: document.location.href,
  };
  sendToBackground(JSON.stringify(payload), "DOMContentLoaded");
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
  const payload = {
    event_type: event.type,
    target: stringifyEventTarget(event),
  };
  sendToBackground(JSON.stringify(payload), "keydown");
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    for (const node of addedNodes) {
      if (node instanceof HTMLInputElement && node.type === "text") {
        node.addEventListener("input", () => {
          // FIXME: add debounce
          sendToBackground(node.value, "input");
        });
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

((xhr) => {
  const XHR = XMLHttpRequest.prototype;

  const open = XHR.open;
  const send = XHR.send;
  const setRequestHeader = XHR.setRequestHeader;

  XHR.open = function (method, url) {
    this._method = method;
    this._url = url;
    this._requestHeaders = {};
    this._startTime = new Date().toISOString();

    // biome-ignore lint/style/noArguments: this is not transpiling correctly.
    return open.apply(this, arguments);
  };

  XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value;
    return setRequestHeader.apply(this, arguments);
  };

  XHR.send = function (postData) {
    this.addEventListener("load", function () {
      const endTime = new Date().toISOString();

      const myUrl = this._url ? this._url.toLowerCase() : this._url;
      if (myUrl) {
        if (postData) {
          if (typeof postData === "string") {
            try {
              this._requestHeaders = postData;
            } catch (err) {
              console.log(
                "Request Header JSON decode failed, transfer_encoding field could be base64",
              );
              console.log(err);
            }
          } else if (
            typeof postData === "object" ||
            Array.isArray(postData) ||
            typeof postData === "number" ||
            typeof postData === "boolean"
          ) {
            this._requestHeaders = JSON.stringify(postData);
          }
        }

        // here you get the RESPONSE HEADERS
        const responseHeaders = this.getAllResponseHeaders();

        if (this.responseType !== "blob" && this.responseText) {
          try {
            const arr = this.responseText;

            sendToBackground(this._url, "request_url");
            sendToBackground(JSON.parse(this._requestHeaders), "request_headers");
            sendToBackground(responseHeaders, "response_headers");
            sendToBackground(JSON.parse(arr), "response_body");
          } catch (err) {
            sendToBackground(err, "response_error");
          }
        }
      }
    });

    // biome-ignore lint/style/noArguments: dynamic.
    return send.apply(this, arguments);
  };
})(XMLHttpRequest);
