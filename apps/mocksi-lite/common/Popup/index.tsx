import { useEffect, useState } from "react";
import Draggable, { type DraggableEventHandler } from "react-draggable";
import { MOCKSI_POPUP_LOCATION } from "../../consts";
import Divider from "./Divider";
import Footer from "./Footer";
import Header from "./Header";

interface PopupProps {
	headerSubtitle?: string;
  shouldDisplayFooter?: boolean;
  email?: string;
  onLogout?: () => void;
  onChat?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const Popup = ({ headerSubtitle, email, shouldDisplayFooter, onLogout, onClose, onChat, children }: PopupProps) => {
	const [position, setPosition] = useState({ x: 0, y: 0 });

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

  const isFooterVisible = shouldDisplayFooter && email && onLogout && onChat;

	return (
		<Draggable handle=".drag-handle" position={position} onStop={onDragStop}>
			<div
				className={
					"w-[500px] h-[596px] shadow-lg rounded-lg m-4 bg-white flex flex-col justify-between"
				}
			>
				<Header subtitle={headerSubtitle} close={onClose} />

        {children}

				{/* FOOTER */}
				{isFooterVisible && (
					<div>
						<Divider />
						<Footer email={email} onLogout={onLogout} onChat={onChat} />
					</div>
				)}
			</div>
		</Draggable>
	);
};

export default Popup;
