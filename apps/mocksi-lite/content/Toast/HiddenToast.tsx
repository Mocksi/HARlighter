import { useEffect, useState } from "react";
import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import TextField from "../../common/TextField";
import { RecordingState } from "../../consts";
import {
	getRecordingsStorage,
	loadRecordingId,
	sendMessage,
} from "../../utils";
import { setEditorMode } from "../EditMode/editMode";
import Divider from "../Popup/Divider";
import Toast from "./index";

interface HiddenToastProps {
	close: () => void;
	onChangeState: (r: RecordingState) => void;
}

const HiddenToast = ({ onChangeState, close }: HiddenToastProps) => {
	const [data, setData] = useState<Recording>();

	const getData = async () => {
		const recordingId = await loadRecordingId();
		const recordings = await getRecordingsStorage();
		return recordings.find((record) => record.uuid === recordingId);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		getData().then((res) => setData(res));
	}, []);

	const handleEdit = () => {
		sendMessage("resetIcon");
		onChangeState(RecordingState.EDITING);
		setEditorMode(true);
	};

	const handleClose = () => {
		sendMessage("resetIcon");
		onChangeState(RecordingState.CREATE);
		close();
	};
	return (
		<Toast className="flex-col py-4 w-[244px] mr-6 mt-1">
			<div className="flex flex-col gap-1 items-center mb-4">
				<TextField variant={"title"}>{data?.demo_name ?? ""}</TextField>
				<TextField>{data?.customer_name ?? data?.url ?? ""}</TextField>
			</div>
			<Divider />
			<div className="flex flex-col items-center gap-1 mt-4">
				<Button onClick={handleEdit}>Edit Demo</Button>
				<Button variant={Variant.secondary} onClick={handleClose}>
					Close Mocksi
				</Button>
			</div>
		</Toast>
	);
};

export default HiddenToast;
