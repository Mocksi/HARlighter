import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "src/components/Popup";

const s = document.createElement("script");
s.src = chrome.runtime.getURL("wrappers.js");
(document.head || document.documentElement).appendChild(s);
let wrapperInstance = null;

s.onload = () => {
	wrapperInstance = window.wrapper;
	s.remove();
};

const rootDiv = document.getElementById("popup-container");
if (rootDiv) {
	rootDiv.id = "popup-container";
	const reactRoot = ReactDOM.createRoot(rootDiv);
	reactRoot.render(
		<React.StrictMode>
			<ChakraProvider>
				<PopUp />
			</ChakraProvider>
		</React.StrictMode>,
	);
}

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

// FIXME: this is not working
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.message === "startRecordingAction") {
		wrapperInstance?.record();
	}
	if (message.message === "stopRecordingAction") {
		wrapperInstance?.remove();
	}
	console.log("window.wrapper mode", wrapperInstance?.mode);
	const status = wrapperInstance ? "success" : "error";
	sendResponse({ status: status });
});
