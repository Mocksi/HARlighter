import { useState } from "react";
import TextField from "../common/TextField";
import {MOCKSI_RECORDING_ID, MOCKSI_RECORDING_STATE, RecordingState} from "../consts";
import closeIcon from "../public/close-icon.png";
import mocksiLogo from "../public/mocksi-logo.png";
import {sendMessage, setRootPosition} from "../utils";
import { setEditorMode } from "./EditMode/editMode";
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
	const initialState = localStorage.getItem(
		MOCKSI_RECORDING_STATE,
	) as RecordingState | null;
	const [state, setState] = useState<RecordingState>(
		initialState ?? RecordingState.UNAUTHORIZED,
	);

	const onChangeState = (newState: RecordingState) => {
		setState(newState);
		setRootPosition(newState);
	};

  const handleUpdate = () => {
    const id = localStorage.getItem(MOCKSI_RECORDING_ID)
    sendMessage("updateDemo", {id});
  };

	if (!isDialogOpen) return null;
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
					onClick={() => {
						onChangeState(RecordingState.CREATE);
						setEditorMode(false);
					}}
					onKeyUp={(event) => {
						if (event.key === "Escape") {
							onChangeState(RecordingState.CREATE);
							setEditorMode(false);
						}
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<div className={"flex flex-col gap-2"}>
					<TextField variant={"title"}>{recordingLabel(state)}</TextField>
					<div className="flex gap-2 items-center">
						<input type="checkbox" className="h-5 w-5 !rounded-lg" />
						<div className={"text-[13px] leading-[15px]"}>
							Highlight All Previous Changes
						</div>
					</div>
				</div>
        <div className="cursor-pointer text-[#009875]" onClick={handleUpdate}>
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
