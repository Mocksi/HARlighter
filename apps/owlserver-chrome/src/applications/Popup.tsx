import React from "react";
import { Box, Heading, Center, Icon, HStack, Text } from "@chakra-ui/react"
  // TODO: add VSCode icons attribution
import { VscRecord } from "react-icons/vsc";

function runStartRecording() {
  chrome.runtime.sendMessage({ action: "startRecording" }, (response) => {
    console.log(response.status); // "success"
  });
}

function PopUp() {
  return (
    <Box w="200px" p={4} >
        <Heading size='md'>Mocksi Lite</Heading>
        <Center>
          <HStack spacing={4}>
            <Text>Start Recording</Text>
            <Icon as={VscRecord} w={8} h={8} color='red.500' onClick={runStartRecording} />
          </HStack>
        </Center>
    </Box>
  );
}

export default PopUp;

