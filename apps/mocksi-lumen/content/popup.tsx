import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";

// Create a new div element and append it to the document's body
const rootDiv = document.getElementById("extension-root");
if (rootDiv) {
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);

	// Use `createRoot` to create a root, then render the <App /> component
	// Note that `createRoot` takes the container DOM node, not the React element
	const root = ReactDOM.createRoot(rootDiv);
	root.render(<ContentApp />);
}