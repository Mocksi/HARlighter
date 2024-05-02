import { Button, HStack } from "@chakra-ui/react";
import { Box, Center, Text } from "@chakra-ui/react";
// biome-ignore lint/style/useImportType: false positive
import React, { useState, useEffect } from "react";
import RecordButton, { MOCKSI_CURRENT_STEP } from "./record_button";

function runStartRecording(isRecording: boolean) {
	const action = isRecording ? "startRecording" : "stopRecording";
	chrome.runtime.sendMessage({ message: action }, (response) => {
		console.log(`${action} status: ${response.status}`);
	});
}

interface StepProps {
	currentStep: string;
	onNextStep: () => void;
}

const StepOne: React.FC<StepProps> = ({ currentStep, onNextStep }) => {
	if (Number(currentStep) > 1) {
		return null;
	}

	// FIXME: use correct color constants
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
					<Button
						color="blue"
						isDisabled={currentStep === "0"}
						onClick={onNextStep}
					>
						Next
					</Button>
				</Center>
			</HStack>
		</Box>
	);
};

const StepTwo: React.FC<StepProps> = ({currentStep, onNextStep}) => {
	if (Number(currentStep) !== 2) {
		return null;
	}
	return <h1>Step two</h1>;
};

function PopUp() {
	const [currentStep, setCurrentStep] = useState("0");

	useEffect(() => {
		const storedStep = localStorage.getItem(MOCKSI_CURRENT_STEP);
		if (storedStep) {
			setCurrentStep(storedStep);
		}
	});

	const advanceToNextStep = () => {
		const prevStep = Number(currentStep);
		const nextStep = String(prevStep + 1);
		localStorage.setItem(MOCKSI_CURRENT_STEP, nextStep);
		setCurrentStep(nextStep);
	};

	return (
		<>
			<StepOne currentStep={currentStep} onNextStep={advanceToNextStep} />
			<StepTwo currentStep={currentStep} onNextStep={advanceToNextStep} />
		</>
	);
}

export default PopUp;
