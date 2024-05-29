import { useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import recordIcon from "../public/record-icon.png";
import {MOCKSI_RECORDING_STATE, RecordingState} from "../consts";

interface RecordButtonProps {
	onRecordChange: (status: RecordingState) => void;
  state: RecordingState
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

export const RecordButton = ({ state, onRecordChange }: RecordButtonProps) => {

	// biome-ignore lint/correctness/useExhaustiveDependencies: hook will only run once
	useEffect(() => {
		const storageState =
			(localStorage.getItem(MOCKSI_RECORDING_STATE) as RecordingState) ||
			RecordingState.READY;

		onRecordChange(storageState);
		// THIS IS FOR DEMO PURPOSES
		if (storageState === RecordingState.ANALYZING) {
      // // Sets extension current position
      // const extensionRoot = document.getElementById("extension-root");
			setTimeout(() => {
      //   if (extensionRoot) {
      //     extensionRoot.className = 'bottom-extension'
      //   }
        onRecordChange(RecordingState.READY);
				localStorage.setItem(
					MOCKSI_RECORDING_STATE,
					RecordingState.READY.toString(),
				);
			}, 3000);
		}
	}, []);

	const handleToggleRecording = () => {
		const newRecordState = nextRecordingState(state);
		onRecordChange(newRecordState);
		localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordState.toString());
		// THIS IS FOR DEMO PURPOSES
		if (newRecordState === RecordingState.ANALYZING) {
			setTimeout(() => {
				onRecordChange(RecordingState.READY);
				localStorage.setItem(
					MOCKSI_RECORDING_STATE,
					RecordingState.READY.toString(),
				);
			}, 10000);
		}
	};

	const { color, label } = recordingColorAndLabel(state);
  if (state === RecordingState.READY) {
    return (
      <div className={'cursor-pointer'} onClick={handleToggleRecording}>
        <img src={recordIcon} alt={'recordIcon'} />
      </div>
    )
  }
	return (
		<button
			className={`h-full w-[56px] border-r-2 text-center ${color} text-white`}
			type="button"
			onClick={
				state !== RecordingState.ANALYZING
					? () => handleToggleRecording()
					: () => undefined
			}
		>
			{state !== RecordingState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
