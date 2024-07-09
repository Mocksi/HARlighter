import { useContext, useEffect } from "react";
import { MOCKSI_RECORDING_STATE, RecordingState } from "../consts";
import recordIcon from "../public/record-icon.png";
import { LoadingSpinner } from "./LoadingSpinner";
import { AppEvent, AppState, AppStateContext } from "./AppStateContext";

interface RecordButtonProps {}
const waitTime = 2000; // 2 seconds

const recordingColorAndLabel = (currentStatus: AppState) => {
	switch (currentStatus) {
		case AppState.READY:
			return { color: "bg-green/95", label: "Start" };
		case AppState.RECORDING:
			return { color: "bg-crimson/95", label: "Stop" };
		case AppState.ANALYZING:
			return { color: "bg-orange/95", label: "Analyzing" };
		default:
			return { color: "bg-green/95", label: "Start" };
	}
};

export const RecordButton = ({}: RecordButtonProps) => {
	const { state, dispatch } = useContext(AppStateContext);

	// useEffect(() => {
	// 	chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
	// 		const storageState =
	// 			(result[MOCKSI_RECORDING_STATE] as RecordingState) ||
	// 			RecordingState.READY;

	// 		onRecordChange(storageState);
	// 		if (storageState === RecordingState.ANALYZING) {
	// 			setTimeout(() => {
	// 				onRecordChange(RecordingState.CREATE);
	// 				chrome.storage.local.set({
	// 					[MOCKSI_RECORDING_STATE]: RecordingState.CREATE.toString(),
	// 				});
	// 			}, waitTime);
	// 		}
	// 	});
	// }, [onRecordChange]);

	const handleToggleRecording = () => {
		dispatch({ event: AppEvent.START_RECORDING });

		setTimeout(() => {
			dispatch({ event: AppEvent.STOP_RECORDING });
		}, waitTime);

		setTimeout(() => {
			dispatch({ event: AppEvent.STOP_ANALYZING });
		}, waitTime * 2);
	};

	const { color, label } = recordingColorAndLabel(state);

	if (state === AppState.READY) {
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
				state !== AppState.ANALYZING ? handleToggleRecording : undefined
			}
			onKeyUp={(event) => {
				if (event.key === "Escape" && state !== AppState.ANALYZING) {
					handleToggleRecording();
				}
			}}
		>
			{state !== AppState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
