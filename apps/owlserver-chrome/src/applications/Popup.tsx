import React from "react";

function runStartRecording() {
  chrome.runtime.sendMessage({ action: "startRecording" }, (response) => {
    console.log(response.status); // "success"
  });
}

function GenerateHarButton() {
  return (
    <div>
      <button type="button" onClick={runStartRecording}>Start Recording</button>
    </div>
  );
}

function PopUp() {
  return (
    <div>
      <img src="./owlserver.png" alt="Owlserver logo"/>
      <GenerateHarButton />
    </div>
  );
}

export default PopUp;
