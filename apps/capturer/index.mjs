import { launch } from 'chrome-launcher';
import CDP from 'chrome-remote-interface';

async function launchChrome() {
    return launch({
        chromeFlags: [
            '--remote-debugging-port=9222',
            '--no-sandbox'
        ]
    });
}


async function insertEvent(type, data, sessionID) {
    let jsonData = '';
    let base64Encoded = false;
    try {
        jsonData = JSON.stringify(data);
    }
    catch (e) {
        console.log('Error parsing data, falling back to base 64', e);
    }
    const unixTime = Math.floor(Date.now() / 1000);

    const event = {
        type,
        data: jsonData,
        base64Encoded,
        sessionID,
        unixTime
    };
    console.log('Event:', event);
}

async function captureNetworkTraffic() {
    // FIXME: this should be working, but it's not... At last on Mac OS X
    //  const chrome = await launchChrome();
    // console.log(`Chrome debugging port running on ${chrome.port}. process id: ${chrome.pid}, web socket debugger url: ${chrome.webSocketDebuggerUrl}`);
    const client = await CDP({host: 'localhost', port: 9222});
    const {Network, Page} = client;

    await Promise.all([Page.enable(), Network.enable()]);
    Page.frameStoppedLoading(async (params, sessionID) => {
        insertEvent('frameStoppedLoading', params, sessionID);
    });
    Page.frameStartedLoading(async (params, sessionID) => {
        insertEvent('frameStartedLoading', params, sessionID);
    });

    Page.frameNavigated(async (params, sessionID) => {
        insertEvent('frameNavigated', params, sessionID);
    });

    Page.documentOpened(async (params, sessionID) => {
        insertEvent('documentOpened', params, sessionID);
    });

    Network.clearBrowserCookies();
    Network.clearBrowserCache();

    Network.requestWillBeSent(async (params, sessionID) => {
        insertEvent('request', params.request, sessionID);
        insertEvent('requestHeaders', params.request.headers, sessionID);

        const cookies = await Network.getAllCookies();
        insertEvent('requestCookies', cookies, sessionID);
    });

    Network.dataReceived(async (params, sessionID) => {
        insertEvent('dataReceived', params, sessionID);
    });

    Network.loadingFinished(async (params, sessionID) => {
        insertEvent('loadingFinished', params, sessionID);
    });

    Network.responseReceived(async (params, sessionID) => {
        let response;

        try {
            response = await Network.getResponseBody({requestId: params.requestId});
        } catch (e) {
            console.error('Error getting response body:', e);
        }

        if (!response) {
            return;
        }

        insertEvent('response', response);
        insertEvent('responseBody', response.body);

        const responseUrl = response.url;
        if (!responseUrl) {
            return;
        }
        const responseCookies = await Network.getCookies({urls: [responseUrl]});
        insertEvent('responseCookies', responseCookies);
    });
}

async function main() {
    await captureNetworkTraffic();
}

main().catch(console.error);
