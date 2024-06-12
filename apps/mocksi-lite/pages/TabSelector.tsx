import "./tab-selector.css";
import { Fragment, useEffect, useState } from "react";
import { LoadingSpinner } from "../content/LoadingSpinner";
import chevronDown from "../public/chevron-down.png";

const sendChromeMessage = (tabIdValue: string) => {
	const message = "tabSelected";
	const tabId = Number.parseInt(tabIdValue, 10);
	chrome.runtime.sendMessage({ tabId, message }, (response) => {
		if (response?.status !== "success") {
			console.error("Failed to send message to background script");
			return;
		}
		window.close();
	});
};

const TabSelector = () => {
	useEffect(() => {
		const queryOptions = { active: true, lastFocusedWindow: true };
		// This will always return an array with one tab, the currently active tab
		chrome.tabs.query(queryOptions, (result) => {
			const tabIdValue = result[0].id?.toString() ?? "0";
			sendChromeMessage(tabIdValue);
			return;
		});
	}, []);

	return <LoadingSpinner />;
};

export default TabSelector;
