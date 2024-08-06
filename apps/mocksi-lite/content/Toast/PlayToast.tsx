import { useContext } from "react";
import Button, { CloseButton, Variant } from "../../common/Button";
import { EditIcon, StopIcon } from "../../common/Icons";
import { Logo } from "../../common/Logos";
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
			<CloseButton onClick={handleHideToast} />
			<Logo />
			<div className="mw-flex mw-gap-2">
				<Button onClick={handleStop} variant={Variant.icon}>
					<StopIcon />
				</Button>
				<Button onClick={handleEdit} variant={Variant.icon}>
					<EditIcon />
				</Button>
			</div>
		</Toast>
	);
};

export default PlayToast;
