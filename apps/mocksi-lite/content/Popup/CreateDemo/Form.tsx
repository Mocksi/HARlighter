import { useState } from "react";
import Button, { Variant } from "../../../common/Button";
import TextField from "../../../common/TextField";
import expandIcon from "../../../public/expand-icon.png";
import Divider from "../Divider";
import {sendMessage} from "../../../utils";
import {Recording} from "../../../typings";

interface FormProps {
	onCancel: (recordings?: Recording[]) => void;
}

const Form = ({ onCancel }: FormProps) => {
	const [name, setName] = useState("");
	const [customer, setCustomer] = useState("");

	const handleSubmit = () => {
    sendMessage("createDemo", { demo_name: name, customer_name: customer });
    setTimeout(() => {
      chrome.storage.local.get(['recordings'], results => {
        onCancel(JSON.parse(results.recordings));
      })
    }, 1000);
  };
	return (
		<div className={"flex-1 mt-3"}>
			<Divider />
			<div className={"flex h-full flex-col justify-between"}>
				<div className={"p-4"}>
					<div className={"mb-8"}>
						<TextField variant={"title"} className={"mb-1"}>
							Demo Name
						</TextField>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={"border rounded-lg h-11 px-3 w-full"}
						/>
					</div>
					<div>
						<TextField variant={"title"} className={"mb-1"}>
							Customer
						</TextField>
						<input
							value={customer}
							onChange={(e) => setCustomer(e.target.value)}
							className={"border rounded-lg h-11 px-3 w-full"}
						/>
					</div>
					<div className={"mt-[42px] flex justify-end gap-4"}>
						<Button onClick={onCancel} variant={Variant.secondary}>
							Cancel
						</Button>
						<Button disabled={!name.length} onClick={handleSubmit}>Save Demo</Button>
					</div>
				</div>
				<div className={"flex self-end p-2"}>
					<img src={expandIcon} alt={"expandIcon"} />
				</div>
			</div>
		</div>
	);
};

export default Form;
