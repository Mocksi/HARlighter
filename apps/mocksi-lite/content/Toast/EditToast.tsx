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
		<Toast
			className={
				"mw-mt-3 min-w-64 mw-p-3 mw-flex mw-flex-row mw-items-center mw-gap-6"
			}
		>
			<div
				className="mw-cursor-pointer"
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
			<div className={"mw-flex mw-flex-col mw-gap-2"}>
				<TextField variant={"title"}>{recordingLabel(state)}</TextField>
				<div className="mw-flex mw-gap-2 mw-items-center">
					<input
						checked={areChangesHighlighted}
						onChange={() => onChecked()}
						type="checkbox"
						className="mw-h-5 mw-w-5 !rounded-lg"
					/>
					<div className={"mw-text-[13px] leading-[15px]"}>
						Highlight All Previous Changes
					</div>
				</div>
			</div>
			<div
				className="mw-cursor-pointer mw-text-[#009875]"
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
