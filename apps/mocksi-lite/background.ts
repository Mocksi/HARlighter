console.log('Hello from the background script!')

addEventListener("install", () => {
  // TODO test if this works on other browsers
  // TODO2 Read from environment variable the correct URL to redirect after install
  chrome.tabs.create({
    url: "http://localhost:3000"
    // url: "https://mocksi.ai/login"
  })
})

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(
      tab?.id || 0,
      { text: 'clickedIcon' }
  );
});