import type { Recording } from "../../../background";
import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_RECORDING_ID,
	RecordingState,
} from "../../../consts";
import editIcon from "../../../public/edit-icon.png";
import playIcon from "../../../public/play-icon.png";
import { loadAlterations } from "../../../utils";
import { setEditorMode } from "../../EditMode/editMode";

interface DemoItemProps extends Recording {
	setState: (r: RecordingState) => void;
}

const DemoItem = ({
	uuid,
	demo_name,
	customer_name,
	setState,
	alterations,
	url,
}: DemoItemProps) => {
	const handleEdit = () => {
		setEditorMode(true, uuid);
		loadAlterations(alterations, true);
		setState(RecordingState.EDITING);
	};

	const handlePlay = async () => {
		await chrome.storage.local.set({ [MOCKSI_ALTERATIONS]: alterations });
		await chrome.storage.local.set({ [MOCKSI_RECORDING_ID]: uuid });
		loadAlterations(alterations, false);
		setState(RecordingState.PLAY);
	};

	const domain = new URL(url).hostname;
	return (
		<div className={"flex justify-between px-6"}>
			<div className={"w-[200px]"}>
				<TextField variant={"title"} className={"truncate"}>
					{demo_name}
				</TextField>
				<TextField className={"truncate"}>{customer_name}</TextField>
				<a href={url} target={"_blank"} rel={"noreferrer"}>
					<TextField className={"text-xs underline truncate"}>
						{domain}
					</TextField>
				</a>
			</div>
			<div className={"flex gap-3"}>
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
					disabled={
						!url.includes(window.location.hostname) ||
						!alterations ||
						!alterations.length
					}
				>
					<img src={playIcon} alt={"playIcon"} />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
