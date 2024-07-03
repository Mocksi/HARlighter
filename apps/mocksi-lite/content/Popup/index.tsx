import { useEffect, useState } from "react";
import { RecordingState } from "../../consts";
import { debounce_leading, sendMessage } from "../../utils";
import CreateDemo from "./CreateDemo";
import Divider from "./Divider";
import Footer from "./Footer";
import Header from "./Header";
import RecordDemo from "./RecordDemo";
import Draggable from "react-draggable";

interface PopupProps {
	close: () => void;
	setState: (r: RecordingState) => void;
	state: RecordingState;
	email: string | null;
}

const Popup = ({ close, setState, state, email }: PopupProps) => {
	const [createForm, setCreateForm] = useState<boolean>(false);

	useEffect(() => {
		sendMessage("getRecordings");
	}, []);
	const renderContent = () => {
		switch (state) {
			case RecordingState.CREATE:
				return (
					<CreateDemo
						createForm={createForm}
						setCreateForm={setCreateForm}
						setState={setState}
						state={state}
					/>
				);
			default:
				return <RecordDemo state={state} setState={setState} />;
		}
	};

	const onDragStop = (...args: any[]) => {
		console.log('drag stop', args)
	}

	const onDragStart = (...args: any[]) => {
		console.log('drag stop', args)
	}

	return (
		<Draggable handle=".drag-handle" onStart={onDragStart} onStop={onDragStop}>
		<div
			className={
				"w-[500px] h-[596px] shadow-lg rounded-lg m-4 bg-white flex flex-col justify-between"
			}
		>
			<Header createForm={createForm} close={close} />

			{/* CONTENT */}
			{renderContent()}

			{/* FOOTER */}
			{!createForm && (
				<div>
					<Divider />
					<Footer close={close} email={email} />
				</div>
			)}
		</div>
		</Draggable>
	);
};

export default Popup;
