import { useContext } from "react";
import TextField from "../../common/TextField";
import { popupContent, popupTitle } from "../../consts";
import { recordingLabel } from "../../utils";
import { AppStateContext } from "../AppStateContext";
import { RecordButton } from "../RecordButton";

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
