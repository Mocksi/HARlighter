import { useContext } from "react";
import recordIcon from "../public/record-icon.png";
import { AppEvent, AppState, AppStateContext } from "./AppStateContext";
import { LoadingSpinner } from "./LoadingSpinner";

const waitTime = 2000; // 2 seconds

const recordingColorAndLabel = (currentStatus: AppState) => {
	switch (currentStatus) {
		case AppState.ANALYZING:
			return { color: "mw-bg-orange/95", label: "Analyzing" };
		case AppState.READYTORECORD:
			return { color: "mw-bg-green/95", label: "Start" };
		case AppState.RECORDING:
			return { color: "mw-bg-crimson/95", label: "Stop" };
		default:
			return { color: "mw-bg-green/95", label: "Start" };
	}
};

export const RecordButton = () => {
	const { dispatch, state } = useContext(AppStateContext);

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

	if (state === AppState.READYTORECORD) {
		return (
			<div
				className="mw-cursor-pointer"
				onClick={handleStartRecording}
				onKeyUp={(event) => {
					event.key === "Enter" && handleStartRecording();
				}}
			>
				<img alt={"recordIcon"} src={recordIcon} />
			</div>
		);
	}

	// FIXME: find a better way to handle tailwindcss not seeing these classes when using syntax like `className={"mw-cursor-pointer"}`
	const buttonClassNames = `mw-h-full mw-w-[56px] mw-border-0 mw-text-center mw-text-white ${color}`;
	return (
		<button
			className={buttonClassNames}
			onClick={state !== AppState.ANALYZING ? handleStopRecording : undefined}
			onKeyUp={(event) => {
				if (event.key === "Escape" && state !== AppState.ANALYZING) {
					handleStopRecording();
				}
			}}
			type="button"
		>
			{state !== AppState.ANALYZING ? label : <LoadingSpinner />}
		</button>
	);
};
