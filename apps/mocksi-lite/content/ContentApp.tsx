import {useState} from "react";
import {RecordingState} from "../consts";
import closeIcon from "../public/close-icon.png";
import mocksiLogo from "../public/mocksi-logo.png";
import {setRootPosition} from "../utils";
import Popup from "./Popup";
import {RecordButton} from "./RecordButton";

interface ContentProps {
	isOpen?: boolean;
	sessionCookie?: string | null;
}
const recordingLabel = (currentStatus: RecordingState) => {
	switch (currentStatus) {
		case RecordingState.READY:
			return "Start recording";
		case RecordingState.RECORDING:
			return "Mocksi Recording";
		case RecordingState.ANALYZING:
			return "Analyzing...";
		case RecordingState.UNAUTHORIZED:
			return "Login to record";
		default:
			return "Start recording";
	}
};

export default function ContentApp({ isOpen, sessionCookie }: ContentProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [state, setState] = useState<RecordingState>(
		sessionCookie ? RecordingState.ANALYZING : RecordingState.UNAUTHORIZED,
	);

	const onChangeState = (newState: RecordingState) => {
		setState(newState);
		setRootPosition(newState);
	};

	if (!isDialogOpen) return null;
	if (state === RecordingState.READY || state === RecordingState.CREATE) {
		return (
			<Popup
				state={state}
				label={recordingLabel(state)}
				email={"jana@mocoso.com"}
				close={() => setIsDialogOpen(false)}
				setState={setState}
			/>
		);
	}

	return (
		<div className="border border-grey/40 rounded bg-white h-11 w-64 mt-4 mr-8 flex flex-row items-center justify-between">
			<div className="flex flex-row gap-2 items-center">
				<div
					className="ml-2 cursor-pointer"
					onClick={() => setIsDialogOpen(false)}
					onKeyUp={(event) => {
						event.key === "Escape" && setIsDialogOpen(false);
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<img className="w-[30px] h-[20px]" src={mocksiLogo} alt="mocksiLogo" />
				<span className="font-medium text-[#000F0C] text-sm">
					{recordingLabel(state)}
				</span>
			</div>
			{sessionCookie && (
				<RecordButton state={state} onRecordChange={onChangeState} />
			)}
		</div>
	);
}
