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
