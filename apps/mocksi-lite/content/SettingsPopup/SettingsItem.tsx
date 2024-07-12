import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import TextField from "../../common/TextField";
import { sendMessage } from "../../utils";

interface SettingsItemProps extends Recording {
	onDelete: () => void;
}

const SettingsItem = ({
	uuid,
	demo_name,
	customer_name,
	alterations,
	url,
	onDelete,
}: SettingsItemProps) => {
	const domain = new URL(url).hostname;

	const handleDelete = () => {
		sendMessage("deleteDemo", { id: uuid });
		onDelete();
	};

	return (
        (<div className={"mw-flex mw-justify-between mw-px-6"}>
            <div className={"mw-w-[200px]"}>
				<TextField variant={"title"} className={"truncate"}>
					{demo_name}
				</TextField>
				<TextField className={"truncate"}>{customer_name}</TextField>
				<a href={url} target={"_blank"} rel={"noreferrer"}>
					<TextField className={"mw-text-xs mw-underline truncate"}>
						{domain}
					</TextField>
				</a>
			</div>
            <div className={"mw-flex mw-gap-3"}>
				<Button variant={Variant.primary} onClick={handleDelete}>
					Delete
				</Button>
			</div>
        </div>)
    );
};

export default SettingsItem;
