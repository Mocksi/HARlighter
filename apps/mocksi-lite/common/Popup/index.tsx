import { useEffect, useState } from "react";
import Draggable, { type DraggableEventHandler } from "react-draggable";
import { MOCKSI_POPUP_LOCATION } from "../../consts";
import IframeWrapper from "../../content/IframeWrapper";
import Divider from "../Divider";
import Footer from "./Footer";
import Header from "./Header";

interface PopupProps {
	headerSubtitle?: string;
	shouldDisplayFooter?: boolean;
	email?: string;
	onLogout?: () => void;
	onChat?: () => void;
	onSettings?: () => void;
	onGoBack?: () => void;
	onClose: () => void;
	children: React.ReactNode;
}

const Popup = ({
	headerSubtitle,
	email,
	shouldDisplayFooter,
	onSettings,
	onLogout,
	onClose,
	onGoBack,
	onChat,
	children,
}: PopupProps) => {
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
	const iframeStyle = {
		position: "absolute", // Fixed positioning relative to the viewport
		top: "100px",
		width: "100%",
		height: "75%",
		zIndex: 9999999,
	};

	return (
		<Draggable handle=".drag-handle" position={position} onStop={onDragStop}>
			<div className="mw-w-[500px] mw-h-[596px] shadow-lg mw-rounded-lg mw-m-4 mw-bg-white mw-flex mw-flex-col mw-justify-between mw-border-solid mw-border-black">
				<Header
					subtitle={headerSubtitle}
					close={onClose}
					onSettings={onSettings}
					onGoBack={onGoBack}
				/>
				<IframeWrapper style={iframeStyle}>{children}</IframeWrapper>

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
