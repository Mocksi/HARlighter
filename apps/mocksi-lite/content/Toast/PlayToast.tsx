import { useContext } from "react";
import Button, { Variant } from "../../common/Button";
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
import { AppEvent, AppStateContext } from "../AppStateContext";
import { setEditorMode } from "../EditMode/editMode";
import Toast from "./index";

interface PlayToastProps {
	close: () => void;
}

const PlayToast = ({ close }: PlayToastProps) => {
	const { dispatch } = useContext(AppStateContext);

	const handleEdit = async () => {
		sendMessage("resetIcon");

		const alterations = await getAlterations();
		loadAlterations(alterations, true);

		setEditorMode(true);
		dispatch({ event: AppEvent.START_EDITING });
	};

	const handleHideToast = () => {
		sendMessage("updateToPauseIcon");

		dispatch({ event: AppEvent.START_PLAYING });

		close();
	};

	const handleStop = () => {
		sendMessage("resetIcon");

		undoModifications();

		dispatch({ event: AppEvent.STOP_PLAYING });
	};

	return (
		<Toast className="mw-gap-4 mw-mb-7 mw-px-4 mw-py-3">
			<div
				className="mw-cursor-pointer"
				onClick={handleHideToast}
				onKeyUp={(event) => {
					event.key === "Escape" && handleHideToast();
				}}
			>
				<img alt="closeIcon" src={closeIcon} />
			</div>
			<img alt={"labeledIcon"} src={labeledIcon} />
			<div className="mw-flex mw-gap-2">
				<Button onClick={handleStop} variant={Variant.icon}>
					<img alt={"stopIcon"} src={stopIcon} />
				</Button>
				<Button onClick={handleEdit} variant={Variant.icon}>
					<img alt={"editIcon"} src={editIcon} />
				</Button>
			</div>
		</Toast>
	);
};

export default PlayToast;
