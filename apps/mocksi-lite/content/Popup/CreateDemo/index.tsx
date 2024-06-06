import type { Dispatch, SetStateAction } from "react";
import { Fragment } from "react";
import Button from "../../../common/Button";
import type { RecordingState } from "../../../consts";
import type { Demo } from "../../ContentApp";
import Form from "../CreateDemo/Form";
import Divider from "../Divider";
import DemoItem from "./DemoItem";
import {apiCall} from "../../../https";

interface CreateDemoProps {
	createForm: boolean;
	setCreateForm: (value: boolean) => void;
	setState: (r: RecordingState) => void;
	demos: Demo[];
	setDemos: Dispatch<SetStateAction<Demo[]>>;
  cookie?: string | null;
}
const example = {
  "created_timestamp": "2023-05-25T12:34:56Z",
  "updated_timestamp": "2023-05-25T12:34:56Z",
  "creator": "example_creator",
  "tabID": "tab123",
  "sessionID": "session456",
  "dom_before": "base64_encoded_json_string",
  "alterations": [
    {
      "selector": ".example-class",
      "action": "added",
      "dom_before": "",
      "dom_after": "<div class='example-class'>New Content</div>"
    }
  ]
}
const CreateDemo = ({
	demos,
	setDemos,
	createForm,
	setCreateForm,
	setState,
                      cookie
}: CreateDemoProps) => {
	const handleSubmit = (demo: Demo) => {
    apiCall('recordings', {}, {Authorization: cookie}).then(res => console.log({res}))
		setDemos((prevState: Demo[]) => prevState.concat(demo));
		setCreateForm(false);
	};
	if (createForm)
		return (
			<Form onSubmit={handleSubmit} onCancel={() => setCreateForm(false)} />
		);
	return (
		<div
			className={
				"flex-1 flex flex-col items-center py-8 overflow-y-scroll no-scrollbar"
			}
		>
			{demos.map((demo) => (
				<Fragment key={`demo-item-${demo.id}`}>
					<DemoItem setState={setState} {...demo} />
					<div className={"px-3 w-full my-6"}>
						<Divider />
					</div>
				</Fragment>
			))}
			<Button
				onClick={() => setCreateForm(true)}
				className={!demos.length ? "mt-3" : ""}
			>
				Create New Demo
			</Button>
		</div>
	);
};

export default CreateDemo;
