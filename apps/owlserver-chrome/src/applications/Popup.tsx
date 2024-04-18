import React from "react";
import { Box, Heading, Center, Icon, HStack, Text } from "@chakra-ui/react";
import RecordButton from "./record_button";

function runStartRecording(isRecording: boolean) {
  const action = isRecording ? "startRecording" : "stopRecording";
  chrome.runtime.sendMessage({ action }, (response) => {
    console.log(response.status);
  });
}

// FIXME: refactor this to use a hook
let initState = false;
if (localStorage.getItem("recordingState") === null) {
  localStorage.setItem("recordingState", initState.toString());
} else {
  initState = localStorage.getItem("recordingState") === "true";
}
runStartRecording(initState);

function PopUp() {
  chrome.runtime.sendMessage({ text: "popOpened" });

  return (
    <Box w="200px" p={4}>
      <Heading size="md">Mocksi Lite</Heading>
      <Center>
        <RecordButton
          onRecordChange={runStartRecording}
          initialState={initState}
        />
      </Center>
    </Box>
  );
}

export default PopUp;
