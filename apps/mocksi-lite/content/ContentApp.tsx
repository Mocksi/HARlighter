import { htmlElementToJson } from "@repo/reactor";
import { useContext, useEffect, useState } from "react";
import useShadow from "use-shadow-dom";
import type { Recording } from "../background";
import { MOCKSI_LAST_PAGE_DOM } from "../consts";
import { extractStyles, logout } from "../utils";
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

// [NOTE]: Draggable component was removed but can be recovered at
// commit 0ed812fa248cbb4a5aa820fe381e0f20d53828ca
interface ContentProps {
	email?: string;
	initialState?: {
		readOnly?: boolean;
		recordings?: Recording[];
	};
	isOpen?: boolean;
}

function ShadowContentApp({ email, initialState, isOpen }: ContentProps) {
	const { dispatch, state } = useContext(AppStateContext);
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);

	useEffect(() => {
		let dom_as_json = "";
		try {
			dom_as_json = JSON.stringify(htmlElementToJson(document.body));
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
			email,
			onChat: handleOnChat,
			onClose: closeDialog,
			onLogout: handleOnLogout,
		};
		switch (state) {
			case AppState.ANALYZING:
			case AppState.RECORDING:
				return <RecordingToast close={closeDialog} />;
			case AppState.CHAT:
				return <ChatToast close={closeDialog} onChangeState={() => {}} />;
			case AppState.CREATE:
				return <CreatePopup onClose={closeDialog} />;
			case AppState.EDITING:
				return <EditToast initialReadOnlyState={initialState?.readOnly} />;
			case AppState.INIT:
			case AppState.UNAUTHORIZED:
				// When initializing the application and loading state we want to show nothing, potentially this is a loading UI in the future
				return null;
			case AppState.LIST:
				return <ListPopup {...popupProps} />;
			case AppState.PLAY:
				return <PlayToast close={closeDialog} />;
			case AppState.READYTORECORD:
				return <ReadyToRecordPopup {...popupProps} />;
			case AppState.SETTINGS:
				return <SettingsPopup {...popupProps} />;
			default:
				return <ListPopup {...popupProps} />;
		}
	};

	return renderContent();
}

export default function ContentApp({
	email,
	initialState,
	isOpen,
}: ContentProps) {
	const styles = extractStyles(document.styleSheets);
	return useShadow(
		<AppStateProvider initialRecordings={initialState?.recordings}>
			<div className="mcksi-frame-include">
				<ShadowContentApp
					email={email}
					initialState={initialState}
					isOpen={isOpen}
				/>
			</div>
		</AppStateProvider>,
		[],
		{
			styleContent: styles,
		},
	);
}
