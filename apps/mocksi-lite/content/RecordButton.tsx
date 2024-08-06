import { useContext } from "react";
import { AppEvent, AppState, AppStateContext } from "./AppStateContext";
import { LoadingSpinner } from "./LoadingSpinner";

export function RecordSVG() {
	return (
		<svg fill="none" height="92" width="92" xmlns="http://www.w3.org/2000/svg">
			<title>Record</title>
			<rect
				height="90"
				rx="45"
				stroke="#F45B5B"
				strokeWidth="2"
				width="90"
				x="1"
				y="1"
			/>
			<path
				d="M45.89 9.334C25.65 9.334 9.224 25.76 9.224 46S25.65 82.667 45.89 82.667 82.557 66.24 82.557 46c0-20.24-16.39-36.666-36.667-36.666Z"
				fill="#F45B5B"
			/>
		</svg>
	);
}

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
				<RecordSVG />
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
