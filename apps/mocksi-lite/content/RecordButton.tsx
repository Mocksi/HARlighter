import { useEffect, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface RecordButtonProps {
	onRecordChange: (status: RecordingState) => void;
}
const MOCKSI_RECORDING_STATE = "mocksi-recordingState";

export enum RecordingState {
  UNAUTHORIZED = "UNAUTHORIZED",
	READY = "READY",
	RECORDING = "RECORDING",
	ANALYZING = "ANALYZING",
}

const recordingColorAndLabel = (currentStatus: RecordingState) => {
	switch (currentStatus) {
		case RecordingState.READY:
			return { color: "bg-green/95", label: "Start" };
		case RecordingState.RECORDING:
			return { color: "bg-crimson/95", label: "Stop" };
		case RecordingState.ANALYZING:
			return { color: "bg-orange/95", label: "Analyzing" };
		default:
			return { color: "bg-green/95", label: "Start" };
	}
};

const nextRecordingState = (currentStatus: RecordingState) => {
	switch (currentStatus) {
		case RecordingState.READY:
			return RecordingState.RECORDING;
		case RecordingState.RECORDING:
			return RecordingState.ANALYZING;
		case RecordingState.ANALYZING:
			return RecordingState.READY;
		default:
			return RecordingState.READY;
	}
};

export const RecordButton = ({ onRecordChange }: RecordButtonProps) => {
	const [status, setStatus] = useState<RecordingState>(RecordingState.READY);

	// biome-ignore lint/correctness/useExhaustiveDependencies: hook will only run once
	useEffect(() => {
		const storageState =
			(localStorage.getItem(MOCKSI_RECORDING_STATE) as RecordingState) ||
			RecordingState.READY;
		setStatus(storageState);
		onRecordChange(storageState);
		// THIS IS FOR DEMO PURPOSES
		if (storageState === RecordingState.ANALYZING) {
			setTimeout(() => {
				setStatus(RecordingState.READY);
				localStorage.setItem(
					MOCKSI_RECORDING_STATE,
					RecordingState.READY.toString(),
				);
			}, 3000);
		}
	}, []);

	const handleToggleRecording = () => {
		const newRecordState = nextRecordingState(status);
		onRecordChange(newRecordState);
		setStatus(newRecordState);
		localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordState.toString());
		// THIS IS FOR DEMO PURPOSES
		if (newRecordState === RecordingState.ANALYZING) {
			setTimeout(() => {
				setStatus(RecordingState.READY);
        onRecordChange(RecordingState.READY)
				localStorage.setItem(
					MOCKSI_RECORDING_STATE,
					RecordingState.READY.toString(),
				);
			}, 10000);
		}
	};

	const { color, label } = recordingColorAndLabel(status);
	return (
		<button
			className={`h-full w-[56px] border-r-2 text-center ${color} text-white`}
			type="button"
			onClick={
				status !== RecordingState.ANALYZING
					? () => handleToggleRecording()
					: () => undefined
			}
		>
			{status !== RecordingState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
