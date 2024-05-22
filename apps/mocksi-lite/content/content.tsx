import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";

// IMPORTANT! Add css files to manifest.json!!

setTimeout(initial, 1000);

let root: ReactDOM.Root;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.text === "clickedIcon") {
		const extensionRoot = document.getElementById("extension-root");
		if (extensionRoot?.firstChild === null) {
			root = ReactDOM.createRoot(extensionRoot);
			root.render(<ContentApp isOpen={true} sessionCookie={msg.loginToken} />);
		} else {
			root.unmount();
		}
	}
});

function initial() {
	// Create a new div element and append it to the document's body
	const rootDiv = document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);

	// Use `createRoot` to create a root, then render the <App /> component
	// Note that `createRoot` takes the container DOM node, not the React element
	root = ReactDOM.createRoot(rootDiv);
	root.render(<ContentApp />);
}
