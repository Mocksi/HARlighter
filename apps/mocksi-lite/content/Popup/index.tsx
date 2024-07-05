import { useEffect, useState } from "react";
import Draggable, { type DraggableEventHandler } from "react-draggable";
import { MOCKSI_POPUP_LOCATION, RecordingState } from "../../consts";
import { debounce_leading, sendMessage } from "../../utils";
import CreateDemo from "./CreateDemo";
import Divider from "./Divider";
import Footer from "./Footer";
import Header from "./Header";
import RecordDemo from "./RecordDemo";

interface PopupProps {
	close: () => void;
	setState: (r: RecordingState) => void;
	state: RecordingState;
	email: string | null;
}

const Popup = ({ close, setState, state, email }: PopupProps) => {
	const [position, setPosition] = useState({ x: 0, y: 0 });
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

	const onDragStop: DraggableEventHandler = (event, data) => {
		if (data.x === 0 || data.y === 0) {
			return;
		}

		setPosition({ x: data.x, y: data.y });

		chrome.storage.local.set({
			[MOCKSI_POPUP_LOCATION]: {
				x: data.x,
				y: data.y,
			},
		});
	};

	useEffect(() => {
		chrome.storage.local.get([MOCKSI_POPUP_LOCATION], (results) => {
			const location = results[MOCKSI_POPUP_LOCATION];
			if (location) {
				setPosition(location);
			}
		});
	}, []);

	return (
		<Draggable handle=".drag-handle" position={position} onStop={onDragStop}>
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
