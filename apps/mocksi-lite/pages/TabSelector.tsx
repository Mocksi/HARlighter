import "./tab-selector.css";
import {useEffect, useState} from "react";

const TabSelector = () => {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const activeTab = tabs.find(t => t.active);

  useEffect(() => {
    chrome.tabs.query({}, (result) => setTabs(result));
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tabIdValue = event.target.value;
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
        <div className="close-button" onClick={() => window.close()}>
          <img src="../public/close-icon.png" alt="close-icon"/>
        </div>
        <img src="../public/menu-icon.png" alt="menu-icon"/>
      </div>
      <div className="tab-selector-content">
        <label className="localize" data-localize="selectTabs">
          Editing {activeTab?.title ?? ''}
          <select name="tabs" id="tabs" onChange={handleChange}>
            <option value="-1">Select</option>
            {tabs.map(tab => <option value={tab.id?.toString() ?? ""}>{tab.title}</option>)}
          </select>
        </label>
        <div className="tab-selector-checkbox">
          <input type="checkbox"/>
          <div>Highlight All Previous Changes</div>
        </div>
      </div>
    </>
  )
}

export default TabSelector;
