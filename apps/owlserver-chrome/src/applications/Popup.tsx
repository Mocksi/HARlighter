import React from "react";
import { HStack } from "@chakra-ui/react";
import { Center, Box, Text } from "@chakra-ui/react";
import RecordButton from "./record_button";

function runStartRecording(isRecording: boolean) {
  const action = isRecording ? "startRecording" : "stopRecording";
  chrome.runtime.sendMessage({ message: action }, (response) => {
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
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
      <HStack>
        <Center w="40px" h="40px" bg="tomato" color="white">
          <img src="../assets/birdie.svg" alt="Birdie" />
        </Center>
        <Center w="200px" h="40px" bg="white" color="black">
          <Text>Mocksi Recording</Text>
        </Center>
        <Center w="80px" h="40px" bg="red" color="white">
          <RecordButton
            initialState={initState}
            onRecordChange={runStartRecording}
          />
        </Center>
      </HStack>
    </Box>
  );
}

export default PopUp;
