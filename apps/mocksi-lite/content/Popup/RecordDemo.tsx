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
				className={"flex flex-col justify-center items-center gap-6 mt-[75px]"}
			>
				<RecordButton />
				<TextField>{label}</TextField>
			</div>

			<div className={"flex flex-col p-6 gap-4"}>
				<TextField className={"text-[17px] font-medium leading-5"}>
					{popupTitle}
				</TextField>
				{popupContent.map(({ title, text }) => (
					<div key={`text-item-${title}`}>
						<TextField variant={"title"} className={"mb-1"}>
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
