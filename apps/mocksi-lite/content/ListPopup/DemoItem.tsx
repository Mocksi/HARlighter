import { useContext, useEffect, useRef } from "react";
import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import { EditIcon, PlayIcon } from "../../common/Icons";
import TextField from "../../common/TextField";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_RECORDING_CREATED_AT,
	MOCKSI_RECORDING_ID,
} from "../../consts";
import { sendMessage } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";

interface DemoItemProps extends Recording {
	hasImageEdits: boolean;
}

const DemoItem = ({
	alterations,
	created_timestamp,
	customer_name,
	demo_name,
	hasImageEdits,
	url,
	uuid,
}: DemoItemProps) => {
	const { dispatch } = useContext(AppStateContext);
	const domain = new URL(url).hostname;

	const handleEdit = async () => {
		await chrome.storage.local.set({
			[MOCKSI_ALTERATIONS]: alterations,
			[MOCKSI_RECORDING_ID]: uuid,
		});

		dispatch({ event: AppEvent.START_EDITING });
	};

	const handlePlay = async () => {
		await chrome.storage.local.set({
			[MOCKSI_ALTERATIONS]: alterations,
			[MOCKSI_RECORDING_CREATED_AT]: created_timestamp,
			[MOCKSI_RECORDING_ID]: uuid,
		});

		sendMessage("updateToPauseIcon");

		dispatch({ event: AppEvent.START_PLAYING });
	};

	return (
		<div className="mw-flex mw-justify-between mw-px-6">
			<div className="mw-w-[200px]">
				<TextField className="truncate" variant={"title"}>
					{demo_name}
				</TextField>
				<TextField className="truncate">{customer_name}</TextField>
				<a href={url} rel={"noreferrer"} target={"_blank"}>
					<TextField className="mw-text-xs mw-underline truncate">
						{domain}
					</TextField>
				</a>
			</div>
			<div className="mw-flex mw-gap-3">
				<Button
					disabled={!url.includes(window.location.hostname)}
					onClick={handleEdit}
					variant={Variant.icon}
				>
					<EditIcon />
				</Button>
				<Button
					disabled={!hasImageEdits && (!alterations || !alterations.length)}
					onClick={handlePlay}
					variant={Variant.icon}
				>
					<PlayIcon />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
