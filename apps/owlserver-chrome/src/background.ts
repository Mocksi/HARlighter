import { Har, Entry, Log, Request, Response, Creator } from 'har-format';

const requests: { [requestId: string]: Request } = {};
const responses: { [requestId: string]: Response } = {};


chrome.webRequest.onBeforeRequest.addListener(
  (details: chrome.webRequest.WebRequestBodyDetails) => {
    if (!['image', 'media', 'font', 'stylesheet'].includes(details.type)) {
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

chrome.webRequest.onCompleted.addListener(
  (details: chrome.webRequest.WebResponseDetails) => {
  },
  { urls: ['<all_urls>'] }
);
// Extend request capture to include query strings and request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    requests[details.requestId] = {
      url: details.url,
      method: details.method,
      httpVersion: 'HTTP/1.1',
      cookies: [],
      headersSize: -1,
      bodySize: -1,
      headers: [],
      queryString: details.url.includes('?') ? details.url.split('?')[1].split('&').map((param) => {
        const [name, value] = param.split('=');
        return { name, value };
      }) : [],
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

// Extend response capture to include response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    // Here you'd capture response headers
    let response = responses[details.requestId]
    response.headers = details.responseHeaders?.map((header) => {
      return {
        name: header.name,
        value: header.value,
      }
    }) || [];
    responses[details.requestId] = response;
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);


function downloadHARFile(harContent: string): void {
  // Create a Blob from the HAR content
  const blob = new Blob([harContent], { type: 'application/json' });

  // Use FileReader to convert the blob to a base64 data URL
  const reader = new FileReader();
  reader.onload = (event: ProgressEvent<FileReader>) => {
    // Ensure the result is a string as expected for data URLs
    const dataUrl = event.target?.result as string | undefined;
    if (dataUrl) {
      // Use chrome.downloads.download to initiate the download
      chrome.downloads.download({
        url: dataUrl,
        filename: 'network-log.har', // Specify the default filename
        // Optional: conflictAction, saveAs, etc.
      }, (downloadId: number) => {
        // Handle the downloadId, e.g., to track the download or show a notification
        console.log(`Download initiated with ID: ${downloadId}`);
      });
    }
  };
  reader.readAsDataURL(blob);
}

function generateHAR(): void {

}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.action === "generateHAR") {
      generateHAR();
      sendResponse({ status: "success" });
    }
  }
);
