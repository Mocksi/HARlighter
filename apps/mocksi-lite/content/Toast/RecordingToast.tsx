import { useContext } from "react";
import { CloseButton } from "../../common/Button";
import { LogoBirdy } from "../../common/Logos";
import { recordingLabel } from "../../utils";
import { AppState, AppStateContext } from "../AppStateContext";
import IframeWrapper from "../IframeWrapper";
import { RecordButton } from "../RecordButton";
import Toast from "./index";

interface RecordingToast {
	close: () => void;
}

const RecordingToast = ({ close }: RecordingToast) => {
	const { state } = useContext(AppStateContext);

	const iframeStyle = {
		border: "none",
		position: "relative",
		zIndex: 9999998,
	};

	return (
		<IframeWrapper style={iframeStyle}>
			<Toast className="mw-justify-between mw-m-2 mw-h-11 mw-w-64">
				<div className="mw-flex mw-flex-row mw-items-center mw-gap-2 mw-pl-2">
					<CloseButton onClick={close} />
					<LogoBirdy />
					<span className="mw-font-medium mw-text-[#000F0C] mw-text-sm">
						{recordingLabel(state)}
					</span>
				</div>
				{state !== AppState.UNAUTHORIZED && <RecordButton />}
			</Toast>
		</IframeWrapper>
	);
};

export default RecordingToast;
