function sendToBackground(data: string) {
  if (!data || !document) {
    return;
  }
  const jsonHolder = document.createElement("script");
  jsonHolder.type = "application/json";
  jsonHolder.id = "jsonHolder";
  const timestamp = Date.now() / 1000;
  const b64encoded = btoa(JSON.stringify(data)) as string;
  try {
    jsonHolder.src = JSON.stringify({ payload: b64encoded, timestamp });
  } catch (e) {
    console.log(e);
    return
  }
  (document.head || document.documentElement).appendChild(jsonHolder);
  if (document.defaultView) {
    const view = Object.assign({}, document.defaultView);
    const event = new CustomEvent("sendToBackground", { detail: view });
    document.dispatchEvent(event);
  } else {
    console.error("Default view is not available");
  }
}

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
              // here you get the REQUEST HEADERS, in JSON format, so you can also use JSON.parse
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

        if (this.responseType != "blob" && this.responseText) {
          // responseText is string or null
          try {
            // here you get RESPONSE TEXT (BODY), in JSON format, so you can use JSON.parse
            const arr = this.responseText;

            // printing url, request headers, response headers, response body, to console

            sendToBackground(this._url);
            sendToBackground(JSON.parse(this._requestHeaders));
            sendToBackground(responseHeaders);
            sendToBackground(JSON.parse(arr));
          } catch (err) {
            sendToBackground("Error in responseType try catch");
            sendToBackground(err);
          }
        }
      }
    });

    // biome-ignore lint/style/noArguments: dynamic.
    return send.apply(this, arguments);
  };
})(XMLHttpRequest);
