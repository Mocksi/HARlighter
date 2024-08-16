import { createRoot } from "react-dom/client";
import AppIframe from "./AppIFrame";
import "./style.css";

const div = document.createElement("div");
div.id = "__root";
div.style = "position:absolute; top:0; right:0;";

document.body.appendChild(div);

/**
 * load the iframe
 * loading from server
 */
const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(<AppIframe />);

try {
  console.log("content script loaded");
} catch (e) {
  console.error(e);
}
