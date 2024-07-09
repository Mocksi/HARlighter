import { useContext, useEffect, useState } from "react";
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
import { AppState, AppStateContext, AppStateProvider } from "./AppStateContext";

interface ContentProps {
	isOpen?: boolean;
	email: string | null;
}

function ShadowContentApp({ isOpen, email }: ContentProps) {
	const { state } = useContext(AppStateContext);
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);

	useEffect(() => {
		let dom_as_json = "";
		try {
			dom_as_json = innerHTMLToJson(document.body.innerHTML);
		} catch (e) {
			console.error("Error setting last page dom:", e);
		}
		chrome.storage.local.set({ [MOCKSI_LAST_PAGE_DOM]: dom_as_json });
	});

	const closeDialog = () => setIsDialogOpen(false);

	if (!isDialogOpen) {
		return null;
	}

	const renderContent = () => {
		switch (state) {
			case AppState.READY:
			case AppState.CREATE:
				return (
					<Popup
						close={closeDialog}
						email={email}
					/>
				);
			case AppState.EDITING:
				return <EditToast />;
			case AppState.PLAY:
				return <PlayToast close={closeDialog} />;
			case AppState.CHAT:
				return <ChatToast onChangeState={() => {}} close={closeDialog} />;
			default:
				return (
					<RecordingToast
						close={closeDialog}
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
}: ContentProps) {
	const styles = extractStyles();
	return useShadow(
		<AppStateProvider>
			<ShadowContentApp
				isOpen={isOpen}
				email={email}
			/>
		</AppStateProvider>,
		[],
		{
			styleContent: styles,
		},
	);
}
