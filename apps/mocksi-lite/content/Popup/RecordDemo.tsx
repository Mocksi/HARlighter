import TextField from "../../common/TextField";
import { type RecordingState, popupContent, popupTitle } from "../../consts";
import { RecordButton } from "../RecordButton";

interface RecordDemoProps {
	label: string;
	state: RecordingState;
	setState: (s: RecordingState) => void;
}

const RecordDemo = ({ label, state, setState }: RecordDemoProps) => {
	return (
		<>
			<div
				className={"flex flex-col justify-center items-center gap-6 mt-[75px]"}
			>
				<RecordButton state={state} onRecordChange={setState} />
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
