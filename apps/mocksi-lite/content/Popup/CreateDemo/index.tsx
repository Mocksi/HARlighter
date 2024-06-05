import type { Dispatch, SetStateAction } from "react";
import { Fragment } from "react";
import Button from "../../../common/Button";
import type { RecordingState } from "../../../consts";
import type { Demo } from "../../ContentApp";
import Form from "../CreateDemo/Form";
import Divider from "../Divider";
import DemoItem from "./DemoItem";

interface CreateDemoProps {
	createForm: boolean;
	setCreateForm: (value: boolean) => void;
	setState: (r: RecordingState) => void;
	demos: Demo[];
	setDemos: Dispatch<SetStateAction<Demo[]>>;
}

const CreateDemo = ({
	demos,
	setDemos,
	createForm,
	setCreateForm,
	setState,
}: CreateDemoProps) => {
	const handleSubmit = (demo: Demo) => {
		setDemos((prevState: Demo[]) => prevState.concat(demo));
		setCreateForm(false);
	};
	if (createForm)
		return (
			<Form onSubmit={handleSubmit} onCancel={() => setCreateForm(false)} />
		);
	return (
		<div className={"flex-1 flex flex-col items-center pt-8"}>
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
