import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import editIcon from "../../../public/edit-icon.png";
import exportIcon from "../../../public/export-icon.png";
import type { Demo } from "./index";

const DemoItem = ({ name, customer }: Demo) => {
	return (
		<div className={"flex justify-between w-full px-6"}>
			<div>
				<TextField variant={"title"}>{name}</TextField>
				<TextField>{customer}</TextField>
			</div>
			<div className={"flex gap-3"}>
				<Button variant={Variant.icon} onClick={() => {}}>
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
