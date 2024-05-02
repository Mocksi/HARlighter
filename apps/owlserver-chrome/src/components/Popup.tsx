import { Button, HStack } from "@chakra-ui/react";
import { Box, Center, Text } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import RecordButton from "./record_button";

function runStartRecording(isRecording: boolean) {
	const action = isRecording ? "startRecording" : "stopRecording";
	chrome.runtime.sendMessage({ message: action }, (response) => {
		console.log(`${action} status: ${response.status}`);
	});
}

function PopUp() {
	// FIXME: create color constants
	return (
		<Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
			<HStack>
				<Center w="40px" h="40px" bg="white">
					<img src="../assets/birdie.svg" alt="Birdie" />
				</Center>
				<Center w="200px" h="40px" bg="white" color="black">
					<Text>Step 1: Record your app</Text>
				</Center>
				<Center w="80px" h="40px" bg="white" color="white">
					<RecordButton onRecordChange={runStartRecording} />
					<Button color="blue" isDisabled>
						Next
					</Button>
				</Center>
			</HStack>
		</Box>
	);
}

export default PopUp;
