import ReactDOM from "react-dom/client";
import TabSelector from "./TabSelector";

document.addEventListener("DOMContentLoaded", () => {
	const rootDiv = document.getElementById("tab-selector-container");
	if (!rootDiv) return;
	const reactRoot = ReactDOM.createRoot(rootDiv);
	reactRoot.render(<TabSelector />);
});
