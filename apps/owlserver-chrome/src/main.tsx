import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "src/applications/Popup";
import { ChakraProvider } from "@chakra-ui/react";

const s = document.createElement("script");
s.src = chrome.runtime.getURL("wrappers.js");
(document.head || document.documentElement).appendChild(s);
s.onload = () => {
  s.remove();
};

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
