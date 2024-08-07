import { useContext, useState } from "react";
import { CloseButton } from "../../common/Button";
import TextField from "../../common/TextField";
import { loadRecordingId, recordingLabel } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import {
	applyReadOnlyMode,
	disableReadOnlyMode,
	setEditorMode,
} from "../EditMode/editMode";
import { getHighlighter } from "../EditMode/highlighter";
import IframeWrapper from "../IframeWrapper";
import Toast from "./index";

type EditToastProps = {
	initialReadOnlyState?: boolean;
};

const EditToast = ({ initialReadOnlyState }: EditToastProps) => {
	const { dispatch, state } = useContext(AppStateContext);

	const [areChangesHighlighted, setAreChangesHighlighted] = useState(true);
	const [isReadOnlyModeEnabled, setIsReadOnlyModeEnabled] = useState(
		initialReadOnlyState ?? true,
	);

	const ContentHighlighter = getHighlighter();

	const onChecked = () => {
		setAreChangesHighlighted((prevValue) => {
			ContentHighlighter.showHideHighlights(!prevValue);
			return !prevValue;
		});
	};

	const onReadOnlyChecked = () => {
		setIsReadOnlyModeEnabled((prevValue) => {
			const newVal = !prevValue;

			if (newVal) {
				applyReadOnlyMode();
			} else {
				disableReadOnlyMode();
			}

			return newVal;
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

	const iframeStyle = {
		border: "none",
		position: "relative",
		width: "355px",
		zIndex: 9999998,
	};

	return (
		<IframeWrapper style={iframeStyle}>
			<Toast
				className="mw-flex mw-flex-row mw-items-center mw-gap-6 mw-m-2 mw-p-3 min-w-64"
				id="mocksi-editor-toast"
			>
				<CloseButton onClick={handleCancel} />
				<div className="mw-flex mw-flex-col mw-gap-2">
					<TextField variant={"title"}>{recordingLabel(state)}</TextField>
					<div className="mw-flex mw-items-center mw-gap-2">
						<input
							checked={areChangesHighlighted}
							className="!rounded-lg mw-h-5 mw-w-5"
							onChange={() => onChecked()}
							type="checkbox"
						/>
						<div className="mw-text-[13px] leading-[15px]">
							Highlight All Previous Changes
						</div>
					</div>

					<div className="mw-flex mw-items-center mw-gap-2">
						<input
							checked={isReadOnlyModeEnabled}
							className="!rounded-lg mw-h-5 mw-w-5"
							onChange={() => onReadOnlyChecked()}
							type="checkbox"
						/>
						<div className="mw-text-[13px] leading-[15px]">
							{isReadOnlyModeEnabled ? "Disable" : "Enable"} Read-Only Mode
						</div>
					</div>
				</div>
				<div
					className="mw-text-[#009875] mw-cursor-pointer"
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
		</IframeWrapper>
	);
};

export default EditToast;
