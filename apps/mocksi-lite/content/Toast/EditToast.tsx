import { useContext, useState } from "react";
import TextField from "../../common/TextField";
import closeIcon from "../../public/close-icon.png";
import { loadRecordingId, recordingLabel } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import { setEditorMode } from "../EditMode/editMode";
import { getHighlighter } from "../EditMode/highlighter";
import Toast from "./index";

const EditToast = () => {
	const { state, dispatch } = useContext(AppStateContext);

	const [areChangesHighlighted, setAreChangesHighlighted] = useState(true);

	const ContentHighlighter = getHighlighter();

	const onChecked = () => {
		setAreChangesHighlighted((prevValue) => {
			ContentHighlighter.showHideHighlights(!prevValue);
			return !prevValue;
		});
	};

	const handleSave = async () => {
		const recordingId = await loadRecordingId();

		await setEditorMode(false, recordingId);

		dispatch({ event: AppEvent.SAVE_MODIFICATIONS });
	};

	const handleCancel = () => {
		setEditorMode(false);
		dispatch({ event: AppEvent.CANCEL_EDITING });
	};

	return (
		<Toast className={"mt-3 min-w-64 p-3 flex flex-row items-center gap-6"}>
			<div
				className="cursor-pointer"
				onClick={() => {
					handleCancel();
				}}
				onKeyUp={async (event) => {
					if (event.key === "Escape") {
						handleCancel();
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
					handleSave();
				}}
				onKeyUp={async (event) => {
					if (event.key === "Enter") {
						handleSave();
					}
				}}
			>
				Done
			</div>
		</Toast>
	);
};

export default EditToast;
