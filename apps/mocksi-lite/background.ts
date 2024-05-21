addEventListener("install", () => {
	// TODO test if this works on other browsers
	// TODO2 Read from environment variable the correct URL to redirect after install
	chrome.tabs.create({
		url: "http://localhost:3000",
		// url: "https://mocksi.ai/login",
	});
});


// TODO The same login URL should be the cookie URL
// TODO2 What should we do if user is not logged in?
chrome.action.onClicked.addListener((tab) => {
  chrome.cookies.get({url: 'http://localhost', name: 'sessionid'}, (cookie) => {
    chrome.tabs.sendMessage(tab?.id || 0, { text: "clickedIcon", loginToken: cookie?.value || '' });
  })
});

