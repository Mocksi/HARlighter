import type { Recording } from "../../../background";
import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import { RecordingState } from "../../../consts";
import editIcon from "../../../public/edit-icon.png";
import exportIcon from "../../../public/export-icon.png";
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
  url
}: DemoItemProps) => {
	const handleEdit = () => {
		setEditorMode(true, uuid);
		setState(RecordingState.EDITING);
	};

	return (
		<div className={"flex justify-between w-full px-6"}>
			<div>
				<TextField variant={"title"}>{demo_name}</TextField>
				<TextField>{customer_name}</TextField>
			</div>
			<div className={"flex gap-3"}>
				<Button variant={Variant.icon} onClick={handleEdit} disabled={!url.includes(window.location.hostname)}>
					<img src={editIcon} alt={"editIcon"} />
				</Button>
				<Button
					variant={Variant.icon}
					onClick={() => loadAlterations(alterations)}
          disabled={!url.includes(window.location.hostname)}
				>
					<img src={exportIcon} alt={"exportIcon"} />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
