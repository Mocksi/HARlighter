import {Fragment, useEffect, useState} from "react";
import type {Recording} from "../../../background";
import Button from "../../../common/Button";
import {RecordingState} from "../../../consts";
import Form from "../CreateDemo/Form";
import Divider from "../Divider";
import DemoItem from "./DemoItem";

interface CreateDemoProps {
	createForm: boolean;
	setCreateForm: (value: boolean) => void;
	setState: (r: RecordingState) => void;
}

const CreateDemo = ({
	createForm,
	setCreateForm,
	setState,
}: CreateDemoProps) => {
	const [recordings, setRecordings] = useState<Recording[]>([]);
	useEffect(() => {
		chrome.storage.local.get(["recordings"], (results) =>
			setRecordings(JSON.parse(results.recordings)),
		);
	}, []);

	if (createForm) return <Form onCancel={() => setCreateForm(false)} onSubmit={() => {
    setState(RecordingState.READY);
    setCreateForm(false);
  }} />;
	return (
		<div
			className={
				"flex-1 flex flex-col items-center py-8 overflow-y-scroll no-scrollbar"
			}
		>
			{recordings.map((record) => (
				<Fragment key={`demo-item-${record.uuid}`}>
					<DemoItem setState={setState} {...record} />
					<div className={"px-3 w-full my-6"}>
						<Divider />
					</div>
				</Fragment>
			))}
			<Button
				onClick={() => setCreateForm(true)}
				className={!recordings.length ? "mt-3" : ""}
			>
				Create New Demo
			</Button>
		</div>
	);
};

export default CreateDemo;
