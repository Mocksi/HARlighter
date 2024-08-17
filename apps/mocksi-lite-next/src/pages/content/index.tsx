import { createRoot } from "react-dom/client";
import ExtensionIframe from "./Extension";

const div = document.createElement("div");
div.id = "__root";
// @ts-ignore
div.style = "z-index:99999; position:absolute; top:0; right:0;";
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(<ExtensionIframe />);

try {
  console.log("content script loaded");
} catch (e) {
  console.error(e);
}
