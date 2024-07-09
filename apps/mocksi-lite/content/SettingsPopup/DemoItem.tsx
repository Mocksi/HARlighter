import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import TextField from "../../common/TextField";

interface DemoItemProps extends Recording {}

const DemoItem = ({
	uuid,
	demo_name,
	customer_name,
	alterations,
	url,
}: DemoItemProps) => {
	const domain = new URL(url).hostname;

	const handleDelete = () => {
		console.log('deleting', demo_name)
	};

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
					variant={Variant.primary}
					onClick={handleDelete}
				>
					Delete
				</Button>
			</div>
		</div>
	);
};

export default DemoItem;
