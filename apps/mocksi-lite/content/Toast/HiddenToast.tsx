import { useEffect, useState } from "react";
import type { Recording } from "../../background";
import Button, { Variant } from "../../common/Button";
import Divider from "../../common/Divider";
import TextField from "../../common/TextField";
import {
	getAlterations,
	getRecordingsStorage,
	loadAlterations,
	loadRecordingId,
	sendMessage,
	undoModifications,
} from "../../utils";
import { AppState } from "../AppStateContext";
import { setEditorMode } from "../EditMode/editMode";
import Toast from "./index";

interface HiddenToastProps {
	close: () => void;
	onChangeState: (r: AppState) => void;
}

const HiddenToast = ({ close, onChangeState }: HiddenToastProps) => {
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

	const handleEdit = async () => {
		sendMessage("resetIcon");
		const alterations = await getAlterations();
		onChangeState(AppState.EDITING);
		loadAlterations(alterations, true);
		setEditorMode(true);
	};

	const handleClose = () => {
		undoModifications();
		sendMessage("resetIcon");
		onChangeState(AppState.CREATE);
		close();
	};

	return (
		<Toast className="mw-flex-col mw-mt-1 mw-mr-6 mw-py-4 mw-w-[244px]">
			<div className="mw-flex mw-flex-col mw-items-center mw-gap-1 mw-mb-4">
				<TextField variant={"title"}>{data?.demo_name ?? ""}</TextField>
				<TextField>{data?.customer_name ?? data?.url ?? ""}</TextField>
			</div>
			<Divider />
			<div className="mw-flex mw-flex-col mw-items-center mw-gap-1 mw-mt-4">
				<Button onClick={handleEdit}>Edit Demo</Button>
				<Button onClick={handleClose} variant={Variant.secondary}>
					Close Mocksi
				</Button>
			</div>
		</Toast>
	);
};

export default HiddenToast;
