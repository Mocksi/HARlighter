import { Fragment, useEffect, useState } from "react";
import type { Recording } from "../../../background";
import Button from "../../../common/Button";
import { RecordingState } from "../../../consts";
import { getRecordingsStorage } from "../../../utils";
import Form from "../CreateDemo/Form";
import Divider from "../Divider";
import DemoItem from "./DemoItem";

interface CreateDemoProps {
	createForm: boolean;
	setCreateForm: (value: boolean) => void;
	setState: (r: RecordingState) => void;
	state: RecordingState;
}

const CreateDemo = ({
	createForm,
	setCreateForm,
	setState,
	state,
}: CreateDemoProps) => {
	const [recordings, setRecordings] = useState<Recording[]>([]);

	const getRecordings = async () => {
		let continueFetching = true;
		while (continueFetching) {
			try {
				const newRecordings = await getRecordingsStorage();
				if (newRecordings.length !== recordings.length) {
					setRecordings(newRecordings);
					continueFetching = false; // Stop the loop if recordings have been updated
				}
			} catch (error) {
				continueFetching = false; // Stop the loop in case of an error
			}
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (!createForm && state !== RecordingState.EDITING) {
			getRecordings();
		}
	}, [createForm, state]);

	if (createForm) {
		return <Form onCancel={() => setCreateForm(false)} />;
	}
	return (
		<div className={"flex flex-1 flex-col h-[280px] overflow-x-scroll"}>
			{recordings.length ? (
				<div
					className={"flex-1 flex flex-col py-8 overflow-y-scroll no-scrollbar"}
				>
					{recordings
						.filter((record) => record.url)
						.map((record) => (
							<Fragment key={`demo-item-${record.uuid}`}>
								<DemoItem setState={setState} {...record} />
								<div className={"px-3 w-full my-6"}>
									<Divider />
								</div>
							</Fragment>
						))}
				</div>
			) : null}
			<Button
				onClick={() => setCreateForm(true)}
				className={!recordings.length ? "mt-3 self-center" : "my-3 self-center"}
			>
				Create New Demo
			</Button>
		</div>
	);
};

export default CreateDemo;
