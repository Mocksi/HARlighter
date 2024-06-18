import { Fragment, useEffect, useState } from "react";
import type { Recording } from "../../../background";
import Button from "../../../common/Button";
import type { RecordingState } from "../../../consts";
import { getRecordingsStorage } from "../../../utils";
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
		if (!createForm) {
			getRecordings();
		}
	}, [createForm]);

	if (createForm) return <Form onCancel={() => setCreateForm(false)} />;
	return (
		<div className={"flex flex-1 flex-col h-[280px]"}>
			<div
				className={"flex-1 flex flex-col py-8 overflow-y-scroll no-scrollbar"}
			>
				{recordings.map((record) => (
					<Fragment key={`demo-item-${record.uuid}`}>
						<DemoItem setState={setState} {...record} />
						<div className={"px-3 w-full my-6"}>
							<Divider />
						</div>
					</Fragment>
				))}
			</div>
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
