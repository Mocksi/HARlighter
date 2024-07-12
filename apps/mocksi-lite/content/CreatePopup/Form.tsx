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
		sendMessage("createDemo", { demo_name: name, customer_name: customer });
		onSubmit();
	};

	return (
		<div className={"mw-flex-1 mw-mt-3"}>
			<Divider />
			<div className={"mw-flex mw-h-full mw-flex-col mw-justify-between"}>
				<div className={"mw-p-4"}>
					<div className={"mw-mb-8"}>
						<TextField variant={"title"} className={"mw-mb-1"}>
							Demo Name
						</TextField>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={"mw-border mw-rounded-lg mw-h-11 mw-px-3 mw-w-full"}
						/>
					</div>
					<div>
						<TextField variant={"title"} className={"mw-mb-1"}>
							Customer
						</TextField>
						<input
							value={customer}
							onChange={(e) => setCustomer(e.target.value)}
							className={"mw-border mw-rounded-lg mw-h-11 mw-px-3 mw-w-full"}
						/>
					</div>
					<div className={"mw-mt-[42px] mw-flex mw-justify-end mw-gap-4"}>
						<Button onClick={onCancel} variant={Variant.secondary}>
							Cancel
						</Button>
						<Button disabled={!name.length} onClick={handleSubmit}>
							Save Demo
						</Button>
					</div>
				</div>
				<div className={"mw-flex self-end mw-p-2"}>
					<img src={expandIcon} alt={"expandIcon"} />
				</div>
			</div>
		</div>
	);
};

export default Form;
