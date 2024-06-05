import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import { RecordingState } from "../../../consts";
import editIcon from "../../../public/edit-icon.png";
import exportIcon from "../../../public/export-icon.png";
import { setEditorMode } from "../../content";
import type { Demo } from "./index";

interface DemoItemProps extends Demo {
	setState: (r: RecordingState) => void;
}

const DemoItem = ({ name, customer, setState }: DemoItemProps) => {
	const handleEdit = () => {
		setEditorMode(true);
		setState(RecordingState.EDITING);
	};

	return (
		<div className={"flex justify-between w-full px-6"}>
			<div>
				<TextField variant={"title"}>{name}</TextField>
				<TextField>{customer}</TextField>
			</div>
			<div className={"flex gap-3"}>
				<Button variant={Variant.icon} onClick={() => handleEdit()}>
					<img src={editIcon} alt={"editIcon"} />
				</Button>
				<Button variant={Variant.icon} onClick={() => {}}>
					<img src={exportIcon} alt={"exportIcon"} />
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
