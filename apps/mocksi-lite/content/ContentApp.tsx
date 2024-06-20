import { useEffect, useState } from "react";
import TextField from "../common/TextField";
import {
	MOCKSI_RECORDING_ID,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "../consts";
import closeIcon from "../public/close-icon.png";
import mocksiLogo from "../public/mocksi-logo.png";
import { setRootPosition } from "../utils";
import { setEditorMode } from "./EditMode/editMode";
import { getHighlighter } from "./EditMode/highlighter";
import Popup from "./Popup";
import { RecordButton } from "./RecordButton";

interface ContentProps {
	isOpen?: boolean;
	email: string | null;
}
const recordingLabel = (currentStatus: RecordingState) => {
	switch (currentStatus) {
		case RecordingState.READY:
			return "Start recording";
		case RecordingState.RECORDING:
			return "Mocksi Recording";
		case RecordingState.EDITING:
			return "Editing Template";
		case RecordingState.ANALYZING:
			return "Analyzing...";
		case RecordingState.UNAUTHORIZED:
			return "Login to record";
		default:
			return "Start recording";
	}
};

export default function ContentApp({ isOpen, email }: ContentProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [areChangesHighlighted, setAreChangesHighlighted] = useState(true);
	const [state, setState] = useState<RecordingState>(
		RecordingState.UNAUTHORIZED,
	);
	const ContentHighlighter = getHighlighter();

	useEffect(() => {
		// Load initial state from chrome storage
		chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
			const initialState = result[
				MOCKSI_RECORDING_STATE
			] as RecordingState | null;
			setState(initialState ?? RecordingState.UNAUTHORIZED);
		});
	}, []);

	const onChangeState = (newState: RecordingState) => {
		setState(newState);
		setRootPosition(newState);
		chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: newState });
	};

	const onChecked = () => {
		setAreChangesHighlighted((prevValue) => {
			ContentHighlighter.showHideHighlights(!prevValue);
			return !prevValue;
		});
	};

	const loadRecordingId = async () => {
		return new Promise<string | undefined>((resolve) => {
			chrome.storage.local.get([MOCKSI_RECORDING_ID], (result) => {
				resolve(result[MOCKSI_RECORDING_ID]);
			});
		});
	};

	if (!isDialogOpen) {
		return null;
	}
	if (state === RecordingState.READY || state === RecordingState.CREATE) {
		return (
			<Popup
				state={state}
				label={recordingLabel(state)}
				close={() => setIsDialogOpen(false)}
				setState={onChangeState}
				email={email}
			/>
		);
	}

	if (state === RecordingState.EDITING) {
		return (
			<div className="border border-solid border-grey/40 rounded-l bg-white mt-3 min-w-64 p-3 flex flex-row items-center gap-6">
				<div
					className="cursor-pointer"
					onClick={async () => {
						onChangeState(RecordingState.CREATE);
						const recordingId = await loadRecordingId();
						setEditorMode(false, recordingId);
					}}
					onKeyUp={async (event) => {
						if (event.key === "Escape") {
							onChangeState(RecordingState.CREATE);
							const recordingId = await loadRecordingId();
							setEditorMode(false, recordingId);
						}
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<div className={"flex flex-col gap-2"}>
					<TextField variant={"title"}>{recordingLabel(state)}</TextField>
					<div className="flex gap-2 items-center">
						<input
							checked={areChangesHighlighted}
							onChange={() => onChecked()}
							type="checkbox"
							className="h-5 w-5 !rounded-lg"
						/>
						<div className={"text-[13px] leading-[15px]"}>
							Highlight All Previous Changes
						</div>
					</div>
				</div>
				<div
					className="cursor-pointer text-[#009875]"
					onClick={async () => {
						onChangeState(RecordingState.CREATE);
						const recordingId = await loadRecordingId();
						setEditorMode(false, recordingId);
					}}
					onKeyUp={async (event) => {
						if (event.key === "Enter") {
							onChangeState(RecordingState.CREATE);
							const recordingId = await loadRecordingId();
							setEditorMode(false, recordingId);
						}
					}}
				>
					Done
				</div>
			</div>
		);
	}

	return (
		<div className="border border-solid border-grey/40 rounded bg-white h-11 w-64 mt-4 mr-8 flex flex-row items-center justify-between">
			<div className="flex flex-row gap-2 items-center">
				<div
					className="ml-2 cursor-pointer"
					onClick={() => setIsDialogOpen(false)}
					onKeyUp={(event) => {
						event.key === "Escape" && setIsDialogOpen(false);
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<img className="w-[30px] h-[20px]" src={mocksiLogo} alt="mocksiLogo" />
				<span className="font-medium text-[#000F0C] text-sm">
					{recordingLabel(state)}
				</span>
			</div>
			{state !== RecordingState.UNAUTHORIZED && (
				<RecordButton state={state} onRecordChange={onChangeState} />
			)}
		</div>
	);
}
