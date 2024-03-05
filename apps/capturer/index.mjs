import { launch } from "chrome-launcher";
import CDP from "chrome-remote-interface";
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./capture.db');

async function launchChrome() {
  return launch({
    chromeFlags: ["--remote-debugging-port=9222", "--no-sandbox"],
  });
}

async function insertEvent(type, data, sessionID) {
  let jsonData = "";
  let base64Encoded = false;
  try {
    jsonData = JSON.stringify(data);
  } catch (e) {
    console.log("Error parsing data, falling back to base 64", e);
    base64Encoded = true;
    // Convert data to Base64 if needed
    jsonData = Buffer.from(data.toString()).toString('base64');
  }
  const unixTime = Math.floor(Date.now() / 1000);

  const sql = 'INSERT INTO events (type, data, sessionID, timestamp) VALUES (?, ?, ?, ?)';
  db.run(sql, [type, jsonData, sessionID, unixTime], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });
}

async function captureNetworkTraffic() {
  // FIXME: this should be working, but it's not... At last on Mac OS X
  //  const chrome = await launchChrome();
  // console.log(`Chrome debugging port running on ${chrome.port}. process id: ${chrome.pid}, web socket debugger url: ${chrome.webSocketDebuggerUrl}`);
  const client = await CDP({ host: "localhost", port: 9222 });
  const { Network, Page } = client;

  await Promise.all([Page.enable(), Network.enable()]);
  Page.frameStoppedLoading(async (params, sessionID) => {
    insertEvent("frameStoppedLoading", params, sessionID);
  });
  Page.frameStartedLoading(async (params, sessionID) => {
    insertEvent("frameStartedLoading", params, sessionID);
  });

  Page.frameNavigated(async (params, sessionID) => {
    insertEvent("frameNavigated", params, sessionID);
  });

  Page.documentOpened(async (params, sessionID) => {
    insertEvent("documentOpened", params, sessionID);
  });

  Network.clearBrowserCookies();
  Network.clearBrowserCache();

  Network.requestWillBeSent(async (params, sessionID) => {
    insertEvent("request", params.request, sessionID);
    insertEvent("requestHeaders", params.request.headers, sessionID);

    const cookies = await Network.getAllCookies();
    insertEvent("requestCookies", cookies, sessionID);
  });

  Network.dataReceived(async (params, sessionID) => {
    insertEvent("dataReceived", params, sessionID);
  });

  Network.loadingFinished(async (params, sessionID) => {
    insertEvent("loadingFinished", params, sessionID);
  });

  Network.responseReceived(async (params, sessionID) => {
    let response;

    try {
      response = await Network.getResponseBody({ requestId: params.requestId });
    } catch (e) {
      console.error("Error getting response body:", e);
      return;
    }

    if (!response) {
      return;
    }

    insertEvent("response", response);
    insertEvent("responseBody", response.body);

    const responseUrl = response.url;
    if (!responseUrl) {
      return;
    }
    const responseCookies = await Network.getCookies({ urls: [responseUrl] });
    insertEvent("responseCookies", responseCookies);
  });
}

async function main() {
  await captureNetworkTraffic();
}

main()
  .then(async () => {
    db.run('CREATE TABLE IF NOT EXISTS events ( id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, data TEXT, sessionID TEXT, timestamp INTEGER)');
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
