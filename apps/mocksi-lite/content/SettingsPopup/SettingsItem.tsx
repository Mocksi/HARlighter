import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import TextField from "../../common/TextField";
import { sendMessage } from "../../utils";

interface SettingsItemProps extends Recording {
	onDelete: () => void;
}

const SettingsItem = ({
	customer_name,
	demo_name,
	onDelete,
	url,
	uuid,
}: SettingsItemProps) => {
	const domain = new URL(url).hostname;

	const handleDelete = () => {
		sendMessage("deleteDemo", { id: uuid });
		onDelete();
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
				<Button onClick={handleDelete} variant={Variant.primary}>
					Delete
				</Button>
			</div>
		</div>
	);
};

export default SettingsItem;
