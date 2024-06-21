import { RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import mocksiLogo from "../../public/mocksi-logo.png";
import { recordingLabel } from "../../utils";
import { RecordButton } from "../RecordButton";
import Toast from "./index";

interface RecordingToast {
	close: () => void;
	state: RecordingState;
	onChangeState: (r: RecordingState) => void;
}

const RecordingToast = ({ state, close, onChangeState }: RecordingToast) => {
	return (
		<Toast className={"h-11 w-64 mt-4 mr-8  justify-between"}>
			<div className="flex flex-row gap-2 items-center">
				<div
					className="ml-2 cursor-pointer"
					onClick={close}
					onKeyUp={(event) => {
						event.key === "Escape" && close();
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<img className="w-[30px] h-[20px]" src={mocksiLogo} alt="mocksiLogo" />
				<span className="font-medium text-[#000F0C] text-sm">
					{recordingLabel(state)}
				</span>
			</div>
			{state !== RecordingState.UNAUTHORIZED && (
				<RecordButton state={state} onRecordChange={onChangeState} />
			)}
		</Toast>
	);
};

export default RecordingToast;
