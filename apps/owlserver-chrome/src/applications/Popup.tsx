import React from "react";

function runGenerateHar() {
  chrome.runtime.sendMessage({ action: "generateHAR" }, (response) => {
    console.log(response.status); // "success"
  });
}

function GenerateHarButton() {
  return (
    <div>
      <button onClick={runGenerateHar}>Generate HAR</button>
    </div>
  );
}

function PopUp() {
  return (
    <div>
      <img src="./owlserver.png" />
      <GenerateHarButton />
    </div>
  );
}

export default PopUp;
