import "./tab-selector.css";
import { Fragment, useEffect, useState } from "react";
import chevronDown from "../public/chevron-down.png";

const TabSelector = () => {
	const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
	const [selected, setSelected] = useState<string>("Select");
	const [open, setOpen] = useState(false);
	// const activeTab = tabs.find(t => t.active);

	useEffect(() => {
		chrome.tabs.query({}, (result) => setTabs(result));
	}, []);

	const handleChange = (tab: chrome.tabs.Tab) => {
		setSelected(tab.title ?? "Select");
		setOpen(false);

		const tabIdValue = tab.id?.toString() ?? "";
		const tabId = Number.parseInt(tabIdValue, 10);
		const message = "tabSelected";

		chrome.runtime.sendMessage({ tabId, message }, (response) => {
			if (response?.status !== "success") {
				console.error("Failed to send message to background script");
				return;
			}
		});
		window.close();
	};

	return (
		<>
			<div className="tab-selector-header">
				<div
					className="close-button"
					onClick={() => window.close()}
					onKeyUp={(event) => {
						event.key === "Escape" && window.close();
					}}
				>
					<img src="../public/close-icon.png" alt="close-icon" />
				</div>
				<img src="../public/menu-icon.png" alt="menu-icon" />
			</div>
			<div className="tab-selector-content">
				<label className="localize">Select a Tab to Use With Mocksi</label>
				<div
					className={"dropdown"}
					onClick={() => setOpen(!open)}
					onKeyUp={(event) => {
						event.key === "Escape" && window.close();
					}}
				>
					{selected}
					<img src={chevronDown} alt={"chevronDown"} />
				</div>
				{open && (
					<div className={"dropdown-menu"}>
						{tabs.map((tab) => (
							<Fragment key={`dropdown-tab-menu-${tab.id}`}>
								<div
									className={"dropdown-item"}
									onClick={() => handleChange(tab)}
									onKeyUp={(event) => {
										event.key === "Escape" && window.close();
									}}
								>
									/{tab.title}
								</div>
								<div className={"separator"} />
							</Fragment>
						))}
					</div>
				)}
			</div>
		</>
	);
};

export default TabSelector;
