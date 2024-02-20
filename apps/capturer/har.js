// Code adapted from https://github.com/tai/chrome-har-capturer/
import url from "url";

const packageInfo = {
  version: "1.0.0",
  homepage: "https://example.com",
};

/**
 * Parses page information and associated entries into HAR format.
 * @param {String} pageId - A unique identifier for the page.
 * @param {Object} page - The page information.
 * @returns {Object} The parsed page and its entries.
 */
function parsePage(pageId, page) {
  // page load started at
  const firstRequest = page.entries.get(page.firstRequestId).requestParams;
  const wallTimeMs = firstRequest.wallTime * 1000;
  const startedDateTime = new Date(wallTimeMs).toISOString();
  // page timings
  const onContentLoad = page.domContentEventFiredMs - page.firstRequestMs;
  const onLoad = page.loadEventFiredMs - page.firstRequestMs;
  // process this page load entries
  const entries = [...page.entries.values()]
    .map((entry) => parseEntry(pageId, entry))
    .filter((entry) => entry);
  // outcome
  return {
    page: {
      id: pageId,
      title: page.url,
      startedDateTime,
      pageTimings: {
        onContentLoad,
        onLoad,
      },
      _user: page.user,
    },
    entries,
  };
}

/**
 * Parses an individual network request/response entry into HAR format.
 * @param {String} pageref - The reference to the page this entry belongs to.
 * @param {Object} entry - The network request/response details.
 * @returns {Object|null} The parsed entry or null if it cannot be processed.
 */
function parseEntry(pageref, entry) {
  const payload = computePayload(entry, headers);
  const { mimeType } = response;
  const encoding = entry.responseBodyIsBase64 ? "base64" : undefined;
  // fill entry
  return {
    pageref,
    startedDateTime,
    time,
    request: {
      method,
      url,
      httpVersion,
      cookies: [], // TODO
      headers: headers.request.pairs,
      queryString,
      headersSize: headers.request.size,
      bodySize: payload.request.bodySize,
      // TODO postData
    },
    response: {
      status,
      statusText,
      httpVersion,
      cookies: [], // TODO
      headers: headers.response.pairs,
      redirectURL,
      headersSize: headers.response.size,
      bodySize: payload.response.bodySize,
      _transferSize: payload.response.transferSize,
      content: {
        size: entry.responseLength,
        mimeType,
        compression: payload.response.compression,
        text: entry.responseBody,
        encoding,
      },
    },
    cache: {},
    timings,
    serverIPAddress,
    connection,
    _initiator,
    _priority,
  };

  function parseHeaders(httpVersion, request, response) {
    // convert headers from map to pairs
    const requestHeaders = response.requestHeaders || request.headers;
    const responseHeaders = response.headers;
    const headers = {
      request: {
        map: requestHeaders,
        pairs: zipNameValue(requestHeaders),
        size: -1,
      },
      response: {
        map: responseHeaders,
        pairs: zipNameValue(responseHeaders),
        size: -1,
      },
    };
    // estimate the header size (including HTTP status line) according to the
    // protocol (this information not available due to possible compression in
    // newer versions of HTTP)
    if (httpVersion.match(/^http\/[01].[01]$/)) {
      const requestText = getRawRequest(request, headers.request.pairs);
      const responseText = getRawResponse(response, headers.response.pairs);
      headers.request.size = requestText.length;
      headers.response.size = responseText.length;
    }
    return headers;
  }

  function computeTimings(entry) {
    // https://chromium.googlesource.com/chromium/blink.git/+/master/Source/devtools/front_end/sdk/HAREntry.js
    // fetch the original timing object and compute duration
    const timing = entry.responseParams.response.timing;
    const finishedTimestamp = entry.responseFinishedS || entry.responseFailedS;
    const time = toMilliseconds(finishedTimestamp - timing.requestTime);
    // compute individual components
    const blocked = firstNonNegative([
      timing.dnsStart,
      timing.connectStart,
      timing.sendStart,
    ]);
    let dns = -1;
    if (timing.dnsStart >= 0) {
      const start = firstNonNegative([timing.connectStart, timing.sendStart]);
      dns = start - timing.dnsStart;
    }
    let connect = -1;
    if (timing.connectStart >= 0) {
      connect = timing.sendStart - timing.connectStart;
    }
    const send = timing.sendEnd - timing.sendStart;
    const wait = timing.receiveHeadersEnd - timing.sendEnd;
    const receive = time - timing.receiveHeadersEnd;
    let ssl = -1;
    if (timing.sslStart >= 0 && timing.sslEnd >= 0) {
      ssl = timing.sslEnd - timing.sslStart;
    }
    return {
      time,
      timings: { blocked, dns, connect, send, wait, receive, ssl },
    };
  }

  function computePayload(entry, headers) {
    // From Chrome:
    //  - responseHeaders.size: size of the headers if available (otherwise
    //    -1, e.g., HTTP/2)
    //  - entry.responseLength: actual *decoded* body size
    //  - entry.encodedResponseLength: total on-the-wire data
    //
    // To HAR:
    //  - headersSize: size of the headers if available (otherwise -1, e.g.,
    //    HTTP/2)
    //  - bodySize: *encoded* body size
    //  - _transferSize: total on-the-wire data
    //  - content.size: *decoded* body size
    //  - content.compression: *decoded* body size - *encoded* body size
    let bodySize;
    let compression;
    let transferSize = entry.encodedResponseLength;
    if (headers.response.size === -1) {
      // if the headers size is not available (e.g., newer versions of
      // HTTP) then there is no way (?) to figure out the encoded body
      // size (see #27)
      bodySize = -1;
      compression = undefined;
    } else if (entry.responseFailedS) {
      // for failed requests (`Network.loadingFailed`) the transferSize is
      // just the header size, since that evend does not hold the
      // `encodedDataLength` field, this is performed manually (however this
      // cannot be done for HTTP/2 which is handled by the above if)
      bodySize = 0;
      compression = 0;
      transferSize = headers.response.size;
    } else {
      // otherwise the encoded body size can be obtained as follows
      bodySize = entry.encodedResponseLength - headers.response.size;
      compression = entry.responseLength - bodySize;
    }
    return {
      request: {
        // trivial case for request
        bodySize: parseInt(
          getHeaderValue(headers.request.map, "content-length", -1),
          10,
        ),
      },
      response: {
        bodySize,
        transferSize,
        compression,
      },
    };
  }

  function zipNameValue(map) {
    const pairs = [];
    for (const [name, value] of Object.entries(map)) {
      // insert multiple pairs if the key is repeated
      const values = Array.isArray(value) ? value : [value];
      for (const value of values) {
        pairs.push({ name, value });
      }
    }
    return pairs;
  }

  function getRawRequest(request, headerPairs) {
    const { method, url, protocol } = request;
    const lines = [`${method} ${url} ${protocol}`];
    for (const { name, value } of headerPairs) {
      lines.push(`${name}: ${value}`);
    }
    lines.push("", "");
    return lines.join("\r\n");
  }

  function getRawResponse(response, headerPairs) {
    const { status, statusText, protocol } = response;
    const lines = [`${protocol} ${status} ${statusText}`];
    for (const { name, value } of headerPairs) {
      lines.push(`${name}: ${value}`);
    }
    lines.push("", "");
    return lines.join("\r\n");
  }

  function getHeaderValue(headers, name, fallback) {
    const pattern = new RegExp(`^${name}$`, "i");
    const key = Object.keys(headers).find((name) => {
      return name.match(pattern);
    });
    return key === undefined ? fallback : headers[key];
  }

  function parseQueryString(requestUrl) {
    const { query } = url.parse(requestUrl, true);
    const pairs = zipNameValue(query);
    return pairs;
  }

  function firstNonNegative(values) {
    const value = values.find((value) => value >= 0);
    return value === undefined ? -1 : value;
  }

  function toMilliseconds(time) {
    return time === -1 ? -1 : time * 1000;
  }
}

function create(pages) {
  const har = {
    log: {
      version: "1.2",
      creator: {
        name: "Chrome HAR Capturer",
        version: packageInfo.version,
        comment: packageInfo.homepage,
      },
      pages: [],
      entries: [],
    },
  };

  for (const [pageIndex, page] of pages.entries()) {
    const pageId = `page_${pageIndex + 1}`;
    const { page: parsedPage, entries } = parsePage(pageId, page.info);
    har.log.pages.push(parsedPage);
    har.log.entries.push(...entries);
  }

  return har;
}

export { create };
