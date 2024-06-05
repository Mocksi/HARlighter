import { useState } from "react";
import Button from "../../../common/Button";
import type { RecordingState } from "../../../consts";
import Form from "../CreateDemo/Form";
import Divider from "../Divider";
import DemoItem from "./DemoItem";

interface CreateDemoProps {
	createForm: boolean;
	setCreateForm: (value: boolean) => void;
	setState: (r: RecordingState) => void;
}

export interface Demo {
	id: number;
	name: string;
	customer: string;
	url?: string;
}

const CreateDemo = ({
	createForm,
	setCreateForm,
	setState,
}: CreateDemoProps) => {
	const [demos, setDemos] = useState<Demo[]>([]);

  const handleSubmit = (demo: Demo) => {
    setDemos(prevState => prevState.concat(demo))
    setCreateForm(false);
  }
	if (createForm) return <Form onSubmit={handleSubmit} onCancel={() => setCreateForm(false)} />;
	return (
		<div className={"flex-1 flex flex-col items-center pt-8"}>
			{demos.map((demo) => (
				<DemoItem key={`demo-item-${demo.id}`} setState={setState} {...demo} />
			))}
			{demos.length ? (
				<div className={"px-3 w-full mt-6"}>
					<Divider />
				</div>
			) : null}
			<Button
				onClick={() => setCreateForm(true)}
				className={!demos.length ? "mt-3" : "mt-8"}
			>
				Create New Demo
			</Button>
		</div>
	);
};

export default CreateDemo;
