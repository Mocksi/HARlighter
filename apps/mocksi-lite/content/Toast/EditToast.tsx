import { useState } from "react";
import TextField from "../../common/TextField";
import { MOCKSI_RECORDING_ID, RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import { recordingLabel } from "../../utils";
import { setEditorMode } from "../EditMode/editMode";
import { ContentHighlighter } from "../EditMode/highlighter";
import Toast from "./index";

interface EditToastProps {
	state: RecordingState;
	onChangeState: (r: RecordingState) => void;
}

const EditToast = ({ state, onChangeState }: EditToastProps) => {
	const [areChangesHighlighted, setAreChangesHighlighted] = useState(true);

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
	return (
		<Toast className={"mt-3 min-w-64 p-3 flex flex-row items-center gap-6"}>
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
		</Toast>
	);
};

export default EditToast;
