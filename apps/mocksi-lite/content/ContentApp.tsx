import { useContext, useEffect, useState } from "react";
import useShadow from "use-shadow-dom";
import type { Recording } from "../background";
import { MOCKSI_LAST_PAGE_DOM } from "../consts";
import { extractStyles, innerHTMLToJson, logout } from "../utils";
import {
	AppEvent,
	AppState,
	AppStateContext,
	AppStateProvider,
} from "./AppStateContext";
import CreatePopup from "./CreatePopup";
import ListPopup from "./ListPopup";
import ReadyToRecordPopup from "./ReadyToRecordPopup";
import SettingsPopup from "./SettingsPopup";
import ChatToast from "./Toast/ChatToast";
import EditToast from "./Toast/EditToast";
import PlayToast from "./Toast/PlayToast";
import RecordingToast from "./Toast/RecordingToast";

import(
	/* webpackChunkName: "content_content_css" */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	"./content.css"
);
import(
	/* webpackChunkName: "content_base_css" */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	"./base.css"
);
import(
	/* webpackChunkName: "content_spinner_css" */
	/* webpackPrefetch: true */
	/* webpackPreload: true */
	"./spinner.css"
);

interface ContentProps {
	isOpen?: boolean;
	email?: string;
	initialState?: {
		recordings?: Recording[];
		readOnly?: boolean;
	};
}

function ShadowContentApp({ isOpen, email, initialState }: ContentProps) {
	const { state, dispatch } = useContext(AppStateContext);
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

	const handleOnChat = () => {
		dispatch({ event: AppEvent.START_CHAT });
	};

	const handleOnLogout = () => {
		logout();
	};

	if (!isDialogOpen) {
		return null;
	}

	const renderContent = () => {
		const popupProps = {
			onClose: closeDialog,
			email,
			onChat: handleOnChat,
			onLogout: handleOnLogout,
		};
		switch (state) {
			case AppState.EDITING:
				return <EditToast initialReadOnlyState={initialState?.readOnly} />;
			case AppState.PLAY:
				return <PlayToast close={closeDialog} />;
			case AppState.CHAT:
				return <ChatToast onChangeState={() => {}} close={closeDialog} />;
			case AppState.RECORDING:
			case AppState.ANALYZING:
				return <RecordingToast close={closeDialog} />;
			case AppState.CREATE:
				return <CreatePopup onClose={closeDialog} />;
			case AppState.LIST:
				return <ListPopup {...popupProps} />;
			case AppState.SETTINGS:
				return <SettingsPopup {...popupProps} />;
			case AppState.READYTORECORD:
				return <ReadyToRecordPopup {...popupProps} />;
			case AppState.UNAUTHORIZED:
			case AppState.INIT:
				// When initializing the application and loading state we want to show nothing, potentially this is a loading UI in the future
				return null;
			default:
				return <ListPopup {...popupProps} />;
		}
	};

	return renderContent();
}

export default function ContentApp({
	isOpen,
	email,
	initialState,
}: ContentProps) {
	const styles = extractStyles(document.styleSheets);
	return useShadow(
		<AppStateProvider initialRecordings={initialState?.recordings}>
			<div className="mcksi-frame-include">
				<ShadowContentApp
					isOpen={isOpen}
					email={email}
					initialState={initialState}
				/>
			</div>
		</AppStateProvider>,
		[],
		{
			styleContent: styles,
		},
	);
}
