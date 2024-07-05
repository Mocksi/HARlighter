import { useEffect, useState } from "react";
import useShadow from "use-shadow-dom";
import {
	MOCKSI_LAST_PAGE_DOM,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "../consts";
import { innerHTMLToJson, setRootPosition } from "../utils";
import Popup from "./Popup";
import ChatToast from "./Toast/ChatToast";
import EditToast from "./Toast/EditToast";
import HiddenToast from "./Toast/HiddenToast";
import PlayToast from "./Toast/PlayToast";
import RecordingToast from "./Toast/RecordingToast";

interface ContentProps {
	initialState: RecordingState;
	isOpen?: boolean;
	email: string | null;
}

function ShadowContentApp({ isOpen, email, initialState }: ContentProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [state, setState] = useState<RecordingState>(
		initialState ?? RecordingState.UNAUTHORIZED,
	);
	useEffect(() => {
		let dom_as_json = "";
		try {
			dom_as_json = innerHTMLToJson(document.body.innerHTML);
		} catch (e) {
			console.error("Error setting last page dom:", e);
		}
		chrome.storage.local.set({ [MOCKSI_LAST_PAGE_DOM]: dom_as_json });
	});

	const onChangeState = (newState: RecordingState) => {
		chrome.storage.local
			.set({ [MOCKSI_RECORDING_STATE]: newState })
			.then(() => {
				setState(newState);
				setRootPosition(newState);
			});
	};

	const closeDialog = () => setIsDialogOpen(false);

	if (!isDialogOpen) {
		return null;
	}

	const renderContent = () => {
		switch (state) {
			case RecordingState.READY:
			case RecordingState.CREATE:
				return (
					<Popup
						state={state}
						close={closeDialog}
						setState={onChangeState}
						email={email}
					/>
				);
			case RecordingState.EDITING:
				return <EditToast state={state} onChangeState={onChangeState} />;
			case RecordingState.PLAY:
				return <PlayToast onChangeState={onChangeState} close={closeDialog} />;
			case RecordingState.CHAT:
				return <ChatToast onChangeState={setState} close={closeDialog} />;
			default:
				return (
					<RecordingToast
						close={closeDialog}
						state={state}
						onChangeState={onChangeState}
					/>
				);
		}
	};

	return renderContent();
}

const extractStyles = (): string => {
	let styles = "";
	const styleSheets = Array.from(document.styleSheets) as CSSStyleSheet[];

	for (const sheet of styleSheets) {
		try {
			if (sheet.cssRules) {
				const cssRules = Array.from(sheet.cssRules) as CSSRule[];
				for (const rule of cssRules) {
					styles += rule.cssText;
				}
			}
		} catch (e) {
			console.error("Error accessing stylesheet:", e);
		}
	}

	return styles;
};

export default function ContentApp({
	isOpen,
	email,
	initialState,
}: ContentProps) {
	const styles = extractStyles();
	return useShadow(
		<ShadowContentApp
			initialState={initialState}
			isOpen={isOpen}
			email={email}
		/>,
		[],
		{
			styleContent: styles,
		},
	);
}
