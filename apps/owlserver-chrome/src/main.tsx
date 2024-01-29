import React from "react";
import ReactDOM from "react-dom/client";
import PopUp from "src/applications/Popup";

const root = document.getElementById("popup-container");
const rootDiv = ReactDOM.createRoot(root || document.createElement("div"));
rootDiv.render(
  <React.StrictMode>
    <PopUp />
  </React.StrictMode>
);
