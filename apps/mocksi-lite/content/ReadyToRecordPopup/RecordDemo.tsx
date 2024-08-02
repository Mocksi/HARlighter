import { useContext } from "react";
import TextField from "../../common/TextField";
import { popupContent, popupTitle } from "../../consts";
import { recordingLabel } from "../../utils";
import { AppStateContext } from "../AppStateContext";
import { RecordButton } from "../RecordButton";

export function RecordXL() {
	return (
		<svg fill="none" height="92" width="92" xmlns="http://www.w3.org/2000/svg">
			<title>Record</title>
			<rect
				height="90"
				rx="45"
				stroke="#F45B5B"
				strokeWidth="2"
				width="90"
				x="1"
				y="1"
			/>
			<path
				d="M45.89 9.334C25.65 9.334 9.224 25.76 9.224 46S25.65 82.667 45.89 82.667 82.557 66.24 82.557 46c0-20.24-16.39-36.666-36.667-36.666Z"
				fill="#F45B5B"
			/>
		</svg>
	);
}

const RecordDemo = () => {
	const { state } = useContext(AppStateContext);

	const label = recordingLabel(state);

	return (
		<>
			<div className="mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-6 mw-mt-[75px]">
				<RecordButton />
				<TextField>{label}</TextField>
			</div>
			<div className="mw-flex mw-flex-col mw-gap-4 mw-p-6">
				<TextField className="mw-font-medium mw-text-[17px] leading-5">
					{popupTitle}
				</TextField>
				{popupContent.map(({ text, title }) => (
					<div key={`text-item-${title}`}>
						<TextField className="mw-mb-1" variant={"title"}>
							{title}
						</TextField>
						<TextField>{text}</TextField>
					</div>
				))}
			</div>
		</>
	);
};

export default RecordDemo;
