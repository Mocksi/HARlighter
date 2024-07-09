import { useContext } from "react";
import recordIcon from "../public/record-icon.png";
import { AppEvent, AppState, AppStateContext } from "./AppStateContext";
import { LoadingSpinner } from "./LoadingSpinner";

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

export const RecordButton = () => {
	const { state, dispatch } = useContext(AppStateContext);

	const handleStartRecording = () => {
		dispatch({ event: AppEvent.START_RECORDING });
	};

	const handleStopRecording = () => {
		dispatch({ event: AppEvent.STOP_RECORDING });
		setTimeout(() => {
			dispatch({ event: AppEvent.STOP_ANALYZING });
		}, waitTime);
	};

	const { color, label } = recordingColorAndLabel(state);

	if (state === AppState.READY) {
		return (
			<div
				className={"cursor-pointer"}
				onClick={handleStartRecording}
				onKeyUp={(event) => {
					event.key === "Enter" && handleStartRecording();
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
			onClick={state !== AppState.ANALYZING ? handleStopRecording : undefined}
			onKeyUp={(event) => {
				if (event.key === "Escape" && state !== AppState.ANALYZING) {
					handleStopRecording();
				}
			}}
		>
			{state !== AppState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
