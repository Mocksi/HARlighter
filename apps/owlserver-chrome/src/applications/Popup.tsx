import React from "react";
import { HStack } from "@chakra-ui/react";
import { Center, Box, Text } from "@chakra-ui/react";
import RecordButton from "./record_button";

function runStartRecording(isRecording: boolean) {
  const action = isRecording ? "startRecording" : "stopRecording";
  console.log(`action: ${action}`);
  chrome.runtime.sendMessage({ message: action }, (response) => {
    console.log(`response status:  ${response.status}`)
  });
}

function PopUp() {
  chrome.runtime.sendMessage({ text: "popOpened" });

  // FIXME: create color constants
  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
      <HStack>
        <Center w="40px" h="40px" bg="white">
          <img src="../assets/birdie.svg" alt="Birdie" />
        </Center>
        <Center w="200px" h="40px" bg="white" color="black">
          <Text>Mocksi Recording</Text>
        </Center>
        <Center w="80px" h="40px" bg="white" color="white">
          <RecordButton
            onRecordChange={runStartRecording}
          />
        </Center>
      </HStack>
    </Box>
  );
}

export default PopUp;
