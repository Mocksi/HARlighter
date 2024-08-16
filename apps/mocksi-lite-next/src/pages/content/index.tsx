import { createRoot } from "react-dom/client";
import AppIframe from "./AppIFrame";
import "./style.css";

const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);

/**
 * load the iframe
 * loading from server
 */
const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(
  <div className="bottom-0 left-0 z-50 absolute bg-amber-400 text-black text-lg">
    <AppIframe />
  </div>,
);

try {
  console.log("content script loaded");
} catch (e) {
  console.error(e);
}
