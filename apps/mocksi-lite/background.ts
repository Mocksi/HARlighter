console.log('Hello from the background script!')

addEventListener("install", () => {
  // TODO test if this works on other browsers
  // TODO2 Read from environment variable the correct URL to redirect after install
  chrome.tabs.create({
    url: "https://mocksi.ai/login"
  })
})