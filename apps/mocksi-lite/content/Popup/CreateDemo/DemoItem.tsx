import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import { RecordingState } from "../../../consts";
import editIcon from "../../../public/edit-icon.png";
import exportIcon from "../../../public/export-icon.png";
import type { Recording } from "../../../typings";
import { loadModifications } from "../../../utils";
import { setEditorMode } from "../../content";

interface DemoItemProps extends Recording {
	setState: (r: RecordingState) => void;
}

const DemoItem = ({ demo_name, customer_name, setState }: DemoItemProps) => {
	const handleEdit = () => {
		setEditorMode(true);
		setState(RecordingState.EDITING);
	};

	return (
		<div className={"flex justify-between w-full px-6"}>
			<div>
				<TextField variant={"title"}>{demo_name}</TextField>
				<TextField>{customer_name}</TextField>
			</div>
			<div className={"flex gap-3"}>
				<Button variant={Variant.icon} onClick={() => handleEdit()}>
					<img src={editIcon} alt={"editIcon"} />
				</Button>
				<Button variant={Variant.icon} onClick={() => loadModifications()}>
					<img src={exportIcon} alt={"exportIcon"} />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
