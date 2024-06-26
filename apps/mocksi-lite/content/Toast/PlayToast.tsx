import Button, { Variant } from "../../common/Button";
import { RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import editIcon from "../../public/edit-icon.png";
import labeledIcon from "../../public/labeled-icon.png";
import stopIcon from "../../public/stop-icon.png";
import {
	getAlterations,
	loadAlterations,
	sendMessage,
	undoModifications,
} from "../../utils";
import { setEditorMode } from "../EditMode/editMode";
import Toast from "./index";

interface PlayToastProps {
	close: () => void;
	onChangeState: (r: RecordingState) => void;
}
const PlayToast = ({ onChangeState, close }: PlayToastProps) => {
	const handleEdit = async () => {
		sendMessage("resetIcon");
		const alterations = await getAlterations();
		loadAlterations(alterations, true);
		setEditorMode(true);
		onChangeState(RecordingState.EDITING);
	};
	const handleHideToast = () => {
		sendMessage("updateToPauseIcon");
		onChangeState(RecordingState.PLAY);
		close();
	};

	const handleStop = () => {
		sendMessage("resetIcon");
		undoModifications();
		onChangeState(RecordingState.CREATE);
	};

	return (
		<Toast className={"mb-7 gap-4 py-3 px-4"}>
			<div
				className="cursor-pointer"
				onClick={handleHideToast}
				onKeyUp={(event) => {
					event.key === "Escape" && handleHideToast();
				}}
			>
				<img src={closeIcon} alt="closeIcon" />
			</div>
			<img src={labeledIcon} alt={"labeledIcon"} />
			<div className={"flex gap-2"}>
				<Button variant={Variant.icon} onClick={handleStop}>
					<img src={stopIcon} alt={"stopIcon"} />
				</Button>
				<Button variant={Variant.icon} onClick={handleEdit}>
					<img src={editIcon} alt={"editIcon"} />
				</Button>
			</div>
		</Toast>
	);
};

export default PlayToast;
