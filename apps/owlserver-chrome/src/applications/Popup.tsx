import React, {useState, useEffect} from "react";
import { HStack } from "@chakra-ui/react";
import { Center, Box, Text } from "@chakra-ui/react";
import RecordButton from "./record_button";

function runStartRecording(isRecording: boolean) {
  const action = isRecording ? "startRecording" : "stopRecording";
  chrome.runtime.sendMessage({ message: action }, (response) => {
    console.log(`response status:  ${response.status}`)
  });

  // TODO: move color constants to UI
  const red = "#FF0000";
  const badgeColor: chrome.action.BadgeColorDetails = {color: red};
  chrome.action.setBadgeBackgroundColor( badgeColor, () => {});
  const details: chrome.action.BadgeTextDetails = {text: "Rec"};
  chrome.action.setBadgeText(details, () => {});
}

function PopUp() {
  chrome.runtime.sendMessage({ text: "popOpened" });
  useEffect(() => {

  }, []);

  // FIXME: create color constants
  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
      <HStack>
        <Center w="40px" h="40px" bg="white">
          <img src="../assets/birdie.svg" alt="Birdie" />
        </Center>
        <Center w="200px" h="40px" bg="white" color="black">
          <Text>Record Your App</Text>
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
