import { useEffect, useState } from "react";

interface RecordButtonProps {
	onRecordChange: (status: boolean) => void;
}
const MOCKSI_RECORDING_STATE = "mocksi-recordingState";
export const RecordButton = ({ onRecordChange }: RecordButtonProps) => {
	const [isRecording, setIsRecording] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: hook will only run once
	useEffect(() => {
		if (localStorage.getItem(MOCKSI_RECORDING_STATE) === "true") {
			onRecordChange(true);
			setIsRecording(true);
			return;
		}
		localStorage.setItem(MOCKSI_RECORDING_STATE, "false");
		onRecordChange(false);
		setIsRecording(false);
	}, []);

	const handleToggleRecording = () => {
		const newRecordingState = !isRecording;
		onRecordChange(newRecordingState);
		setIsRecording(newRecordingState);
		localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordingState.toString());
	};

	return (
		<button
			className={`h-full w-[56px] border-r-2 text-center ${
				isRecording ? "bg-crimson/95" : "bg-green/95"
			} text-white`}
			onClick={() => handleToggleRecording()}
			type="button"
		>
			{isRecording ? "Stop" : "Start"}
		</button>
	);
};
