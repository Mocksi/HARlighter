import { useContext } from "react";
import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import TextField from "../../common/TextField";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_RECORDING_CREATED_AT,
	MOCKSI_RECORDING_ID,
} from "../../consts";
import editIcon from "../../public/edit-icon.png";
import playIcon from "../../public/play-icon.png";
import { loadAlterations, sendMessage } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import { setEditorMode } from "../EditMode/editMode";

interface DemoItemProps extends Recording {}

const DemoItem = ({
	uuid,
	demo_name,
	customer_name,
	alterations,
	url,
	created_timestamp,
}: DemoItemProps) => {
	const { dispatch } = useContext(AppStateContext);
	const domain = new URL(url).hostname;

	const handleEdit = async () => {
		await chrome.storage.local.set({
			[MOCKSI_ALTERATIONS]: alterations,
			[MOCKSI_RECORDING_ID]: uuid,
		});

		setEditorMode(true, uuid);
		loadAlterations(alterations, true);
		dispatch({ event: AppEvent.START_EDITING });
	};

	const handlePlay = async () => {
		await chrome.storage.local.set({
			[MOCKSI_ALTERATIONS]: alterations,
			[MOCKSI_RECORDING_ID]: uuid,
			[MOCKSI_RECORDING_CREATED_AT]: created_timestamp,
		});

		if (window.location.href === url) {
			sendMessage("updateToPauseIcon");
			loadAlterations(alterations, false, created_timestamp);
			dispatch({ event: AppEvent.START_PLAYING });
		} else {
			sendMessage("playMode", { url });
		}
	};

	return (
		<div className="mw-flex mw-justify-between mw-px-6">
			<div className="mw-w-[200px]">
				<TextField variant={"title"} className="truncate">
					{demo_name}
				</TextField>
				<TextField className="truncate">{customer_name}</TextField>
				<a href={url} target={"_blank"} rel={"noreferrer"}>
					<TextField className="mw-text-xs mw-underline truncate">
						{domain}
					</TextField>
				</a>
			</div>
			<div className="mw-flex mw-gap-3">
				<Button
					variant={Variant.icon}
					onClick={handleEdit}
					disabled={!url.includes(window.location.hostname)}
				>
					<img src={editIcon} alt={"editIcon"} />
				</Button>
				<Button
					variant={Variant.icon}
					onClick={handlePlay}
					disabled={!alterations || !alterations.length}
				>
					<img src={playIcon} alt={"playIcon"} />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
