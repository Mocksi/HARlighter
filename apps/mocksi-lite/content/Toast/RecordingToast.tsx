import { useContext } from "react";
import closeIcon from "../../public/close-icon.png";
import mocksiLogo from "../../public/mocksi-logo.png";
import { recordingLabel } from "../../utils";
import { AppState, AppStateContext } from "../AppStateContext";
import { RecordButton } from "../RecordButton";
import Toast from "./index";

interface RecordingToast {
	close: () => void;
}

const RecordingToast = ({ close }: RecordingToast) => {
	const { state } = useContext(AppStateContext);

	return (
		<Toast className={"mw-h-11 mw-w-64 mw-mt-4 mw-mr-8  mw-justify-between"}>
			<div className="mw-flex mw-flex-row mw-gap-2 mw-items-center">
				<div
					className="mw-ml-2 mw-cursor-pointer"
					onClick={close}
					onKeyUp={(event) => {
						event.key === "Escape" && close();
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<img
					className="mw-w-[30px] mw-h-[20px]"
					src={mocksiLogo}
					alt="mocksiLogo"
				/>
				<span className="mw-font-medium mw-text-[#000F0C] mw-text-sm">
					{recordingLabel(state)}
				</span>
			</div>
			{state !== AppState.UNAUTHORIZED && <RecordButton />}
		</Toast>
	);
};

export default RecordingToast;
