import { useEffect } from "react";
import { MOCKSI_RECORDING_STATE, RecordingState } from "../consts";
import recordIcon from "../public/record-icon.png";
import { LoadingSpinner } from "./LoadingSpinner";

interface RecordButtonProps {
	onRecordChange: (status: RecordingState) => void;
	state: RecordingState;
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
			return RecordingState.CREATE;
		default:
			return RecordingState.READY;
	}
};

const waitTime = 2000; // 2 seconds

export const RecordButton = ({ state, onRecordChange }: RecordButtonProps) => {
	useEffect(() => {
		chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
			const storageState =
				(result[MOCKSI_RECORDING_STATE] as RecordingState) ||
				RecordingState.READY;
			onRecordChange(storageState);

			if (storageState === RecordingState.ANALYZING) {
				setTimeout(() => {
					onRecordChange(RecordingState.CREATE);
					chrome.storage.local.set({
						[MOCKSI_RECORDING_STATE]: RecordingState.CREATE.toString(),
					});
				}, waitTime);
			}
		});
	}, [onRecordChange]);

	const handleToggleRecording = () => {
		const newRecordState = nextRecordingState(state);
		onRecordChange(newRecordState);
		chrome.storage.local.set({
			[MOCKSI_RECORDING_STATE]: newRecordState.toString(),
		});

		if (newRecordState === RecordingState.ANALYZING) {
			setTimeout(() => {
				onRecordChange(RecordingState.CREATE);
				chrome.storage.local.set({
					[MOCKSI_RECORDING_STATE]: RecordingState.CREATE.toString(),
				});
			}, waitTime);
		}
	};

	const { color, label } = recordingColorAndLabel(state);
	if (state === RecordingState.READY) {
		return (
			<div
				className={"cursor-pointer"}
				onClick={handleToggleRecording}
				onKeyUp={(event) => {
					event.key === "Enter" && handleToggleRecording();
				}}
			>
				<img src={recordIcon} alt={"recordIcon"} />
			</div>
		);
	}
	return (
		<button
			className={`h-full w-[56px] border-0 text-center ${color} text-white`}
			type="button"
			onClick={
				state !== RecordingState.ANALYZING ? handleToggleRecording : undefined
			}
			onKeyUp={(event) => {
				if (event.key === "Escape" && state !== RecordingState.ANALYZING) {
					handleToggleRecording();
				}
			}}
		>
			{state !== RecordingState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
