import { sendToBackground } from "../services/background_interactor";
import { ActionType } from "../services/background_interactor";

((xhr) => {
  const XHR = XMLHttpRequest.prototype;

  const open = XHR.open;
  const abort = XHR.abort;
  const send = XHR.send;
  const setRequestHeader = XHR.setRequestHeader;

  XHR.open = function (method, url) {
    this._method = method;
    this._url = url;
    this._requestHeaders = {};
    this._requestBody = {};
    this._startTime = new Date().toISOString();
    this._requestID = crypto.randomUUID();

    // biome-ignore lint/style/noArguments: this is not transpiling correctly.
    return open.apply(this, arguments);
  };

  XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value;
    // biome-ignore lint/style/noArguments: dynamic
    return setRequestHeader.apply(this, arguments);
  };

  XHR.abort = function () {
    sendToBackground(this._url, ActionType.Abort);
    return abort();
  }

  XHR.send = function (postData) {
    // FIXME: Use XHR.onload instead of XHR.addEventListener("load", ...)
    this.addEventListener("load", function () {

      const myUrl = this._url ? this._url.toLowerCase() : this._url;
      if (!myUrl) {
        // biome-ignore lint/style/noArguments: dynamic.
        return send.apply(this, arguments);
      }

      if (postData) {
        if (typeof postData === "string") {
          try {
            this._requestBody = JSON.parse(postData);
          } catch (err) {
            console.log(err);
          }
        } else if (
          typeof postData === "object" ||
          Array.isArray(postData) ||
          typeof postData === "number" ||
          typeof postData === "boolean"
        ) {
          this._requestBody = postData;
        }
      }
      sendToBackground(this._url, ActionType.RequestUrl);
      sendToBackground(this._requestHeaders, ActionType.RequestHeaders);
      sendToBackground(this._requestBody, ActionType.RequestBody);

      const responseHeaders = this.getAllResponseHeaders();
      if (this.responseType === "" || this.responseType === "text") {
      }

      // FIXME: support all response types
      if (this.responseType !== "blob" && this.responseText) {
        try {
          sendToBackground(responseHeaders, ActionType.ResponseHeaders);
          sendToBackground(this.responseText, ActionType.ResponseBody);
        } catch (err) {
          sendToBackground(err, ActionType.ResponseError);
        }
      }
    });

    // biome-ignore lint/style/noArguments: dynamic.
    return send.apply(this, arguments);
  };
})(XMLHttpRequest);
