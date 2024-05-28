import {useState} from "react";
import closeIcon from "../public/close-icon.png";
import mocksiLogo from "../public/mocksi-logo.png";
import {RecordButton} from "./RecordButton";
import Popup from "./Popup";
import {RecordingState} from "./consts";

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
		sessionCookie ? RecordingState.READY : RecordingState.UNAUTHORIZED,
	);

	if (!isDialogOpen) return null;
  if (state === RecordingState.READY) {
    return <Popup label={recordingLabel(state)} email={'jana@mocoso.com'} close={() => setIsDialogOpen(false)} setState={setState} />
  }
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
			{sessionCookie && <RecordButton onRecordChange={setState} />}
		</div>
	);
}
