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
			<div
				className={
					"mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-6 mw-mt-[75px]"
				}
			>
				<RecordButton />
				<TextField>{label}</TextField>
			</div>
			<div className={"mw-flex mw-flex-col mw-p-6 mw-gap-4"}>
				<TextField className={"mw-text-[17px] mw-font-medium leading-5"}>
					{popupTitle}
				</TextField>
				{popupContent.map(({ title, text }) => (
					<div key={`text-item-${title}`}>
						<TextField variant={"title"} className={"mw-mb-1"}>
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
