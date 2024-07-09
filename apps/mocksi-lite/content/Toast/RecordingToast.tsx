import { useContext } from "react";
import { RecordingState } from "../../consts";
import closeIcon from "../../public/close-icon.png";
import mocksiLogo from "../../public/mocksi-logo.png";
import { recordingLabel } from "../../utils";
import { RecordButton } from "../RecordButton";
import Toast from "./index";
import { AppState, AppStateContext } from "../AppStateContext";

interface RecordingToast {
	close: () => void;
}

const RecordingToast = ({ close }: RecordingToast) => {
	const { state } = useContext(AppStateContext);

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
			{state !== AppState.UNAUTHORIZED && (
				<RecordButton />
			)}
		</Toast>
	);
};

export default RecordingToast;
