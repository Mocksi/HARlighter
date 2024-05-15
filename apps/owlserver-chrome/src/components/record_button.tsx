import { Button } from "@chakra-ui/react";
// biome-ignore lint/style/useImportType: it's ok
import React, { useState, useEffect } from "react";

const MOCKSI_RECORDING_STATE = "mocksi-recording-state";
export const MOCKSI_CURRENT_STEP = "mocksi-current-step";
interface RecordButtonProps {
	onRecordChange: (isRecording: boolean) => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ onRecordChange }) => {
	const [isRecording, setIsRecording] = useState(null);

	useEffect(() => {
		if (localStorage.getItem(MOCKSI_RECORDING_STATE) === "true") {
			setIsRecording(true);
			return;
		}
		localStorage.setItem(MOCKSI_RECORDING_STATE, "false");
		setIsRecording(false);
	}, []);

	onRecordChange(isRecording);

	const handleToggleRecording = () => {
		const newRecordingState = !isRecording;
		onRecordChange(newRecordingState);
		setIsRecording(newRecordingState);
		localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordingState.toString());
		if (newRecordingState) {
			localStorage.setItem(MOCKSI_CURRENT_STEP, "1");
		}
		const type = newRecordingState
			? "startRecordingAction"
			: "stopRecordingAction";
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0].id) {
				chrome.scripting.executeScript(
					{
						target: { tabId: tabs[0].id },
						files: ["main.js"],
					},
					() => {
						chrome.tabs.sendMessage(tabs[0].id, { type: type }, (response) => {
							console.log("Response from content script:", response);
						});
					},
				);
			}
		});
	};

	const label = isRecording ? "stop" : "start";
	const colorScheme = isRecording ? "red" : "green";

	if (isRecording === null) {
		return null;
	}

	return (
		<Button colorScheme={colorScheme} onClick={handleToggleRecording}>
			{label}
		</Button>
	);
};

export default RecordButton;
