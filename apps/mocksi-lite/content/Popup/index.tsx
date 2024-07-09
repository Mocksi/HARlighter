import { useContext, useEffect, useState } from "react";
import Draggable, { type DraggableEventHandler } from "react-draggable";
import { MOCKSI_POPUP_LOCATION } from "../../consts";
import { sendMessage } from "../../utils";
import { AppState, AppStateContext } from "../AppStateContext";
import CreateDemo from "./CreateDemo";
import Divider from "./Divider";
import Footer from "./Footer";
import Header from "./Header";
import RecordDemo from "./RecordDemo";

interface PopupProps {
	close: () => void;
	email: string | null;
}

const Popup = ({ close, email }: PopupProps) => {
	const { state } = useContext(AppStateContext);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [createForm, setCreateForm] = useState<boolean>(false);

	useEffect(() => {
		sendMessage("getRecordings");
	}, []);

	const renderContent = () => {
		if (state === AppState.CREATE) {
			return (
				<CreateDemo createForm={createForm} setCreateForm={setCreateForm} />
			);
		}

		return <RecordDemo />;
	};

	const onDragStop: DraggableEventHandler = (
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		event: any,
		data: { x: number; y: number },
	) => {
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
