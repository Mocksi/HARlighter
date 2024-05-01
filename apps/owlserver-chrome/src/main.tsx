import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "src/components/Popup";
import { ChakraProvider } from "@chakra-ui/react";

const scripts = [
  "document_observer.js",
  "network_wrapper_observer.js",
];

for (const script of scripts) {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL(script);
  (document.head || document.documentElement).appendChild(s);
  s.onload = () => {
    s.remove();
  };
}

const root = document.getElementById("popup-container");
const rootDiv = ReactDOM.createRoot(root || document.createElement("div"));
rootDiv.render(
  <React.StrictMode>
    <ChakraProvider>
      <PopUp />
    </ChakraProvider>
  </React.StrictMode>,
);

document.addEventListener("wrapperToBackground", (e): void => {
  const jsonHolder = document.getElementById("jsonHolder");
  const data = jsonHolder?.getAttribute("src") || "";
  jsonHolder?.remove();
  chrome.runtime.sendMessage(
    { message: "wrapperToBackground", data },
    (response) => {
      if (response.status !== "success") {
        console.log(response);
      }
    },
  );
});
