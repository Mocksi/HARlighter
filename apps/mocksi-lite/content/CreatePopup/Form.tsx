import { useState } from "react";
import Button, { Variant } from "../../common/Button";
import Divider from "../../common/Divider";
import TextField from "../../common/TextField";
import expandIcon from "../../public/expand-icon.png";
import { sendMessage } from "../../utils";

interface FormProps {
	onCancel: () => void;
	onSubmit: () => void;
}

const Form = ({ onCancel, onSubmit }: FormProps) => {
	const [name, setName] = useState("");
	const [customer, setCustomer] = useState("");

	const handleSubmit = () => {
		sendMessage("createDemo", { customer_name: customer, demo_name: name });
		onSubmit();
	};

	return (
		<div className="mw-flex-1 mw-mt-3">
			<Divider />
			<div className="mw-flex mw-flex-col mw-justify-between mw-h-full">
				<div className="mw-p-4">
					<div className="mw-mb-8">
						<TextField className="mw-mb-1" variant={"title"}>
							Demo Name
						</TextField>
						<input
							className="mw-px-3 mw-border mw-rounded-lg mw-h-11 mw-w-full"
							onChange={(e) => setName(e.target.value)}
							value={name}
						/>
					</div>
					<div>
						<TextField className="mw-mb-1" variant={"title"}>
							Customer
						</TextField>
						<input
							className="mw-px-3 mw-border mw-rounded-lg mw-h-11 mw-w-full"
							onChange={(e) => setCustomer(e.target.value)}
							value={customer}
						/>
					</div>
					<div className="mw-flex mw-justify-end mw-gap-4 mw-mt-[42px]">
						<Button onClick={onCancel} variant={Variant.secondary}>
							Cancel
						</Button>
						<Button disabled={!name.length} onClick={handleSubmit}>
							Save Demo
						</Button>
					</div>
				</div>
				<div className="mw-flex mw-p-2 self-end">
					<img alt={"expandIcon"} src={expandIcon} />
				</div>
			</div>
		</div>
	);
};

export default Form;
