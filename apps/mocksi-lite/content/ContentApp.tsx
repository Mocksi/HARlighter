import { useState } from "react";
import closeIcon from "../public/close-icon.png";
import mocksiLogo from "../public/mocksi-logo.png";
import { RecordButton, RecordingState } from "./RecordButton";

interface ContentProps {
	isOpen?: boolean;
}
const recordingLabel = (currentStatus: RecordingState) => {
	switch (currentStatus) {
		case RecordingState.READY:
			return "Record your app";
		case RecordingState.RECORDING:
			return "Mocksi Recording";
		case RecordingState.ANALYZING:
			return "Analyzing...";
		default:
			return "Record your app";
	}
};

export default function ContentApp({ isOpen }: ContentProps) {
	const [isdialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [state, setState] = useState<RecordingState>(RecordingState.READY);

	if (!isdialogOpen) return null;
	return (
		<div className="border border-grey/40 rounded bg-white h-11 w-64 mt-4 mr-8 flex flex-row items-center">
			<div className="flex flex-row w-[80%] gap-2">
				<div
					className="ml-2 cursor-pointer"
					onClick={() => setIsDialogOpen(false)}
					onKeyUp={(event) => {
						event.key === "esc" && setIsDialogOpen(false);
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<img className="w-[30px] h-[20px]" src={mocksiLogo} alt="mocksiLogo" />
				<span className="font-medium text-[#000F0C] text-sm">
					{recordingLabel(state)}
				</span>
			</div>
			<RecordButton onRecordChange={setState} />
		</div>
	);
}
