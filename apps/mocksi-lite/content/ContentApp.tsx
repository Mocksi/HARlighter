import { useEffect, useState } from "react";
import useShadow from "use-shadow-dom";
import { MOCKSI_RECORDING_STATE, RecordingState } from "../consts";
import { setRootPosition } from "../utils";
import Popup from "./Popup";
import EditToast from "./Toast/EditToast";
import HiddenToast from "./Toast/HiddenToast";
import PlayToast from "./Toast/PlayToast";
import RecordingToast from "./Toast/RecordingToast";

interface ContentProps {
	isOpen?: boolean;
	email: string | null;
}

function ShadowContentApp({ isOpen, email }: ContentProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [state, setState] = useState<RecordingState>(
		RecordingState.UNAUTHORIZED,
	);

	useEffect(() => {
		// Load initial state from chrome storage
		chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
			const initialState = result[
				MOCKSI_RECORDING_STATE
			] as RecordingState | null;
			setState(initialState ?? RecordingState.UNAUTHORIZED);
		});
	}, []);

	const onChangeState = (newState: RecordingState) => {
    chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: newState }).then(() => {
      setState(newState);
      setRootPosition(newState);
    })
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
						setState={setState}
						email={email}
					/>
				);
			case RecordingState.EDITING:
				return <EditToast state={state} onChangeState={setState} />;
			case RecordingState.PLAY:
				return <PlayToast onChangeState={setState} close={closeDialog} />;
			case RecordingState.HIDDEN:
				return <HiddenToast onChangeState={setState} close={closeDialog} />;
			default:
				return (
					<RecordingToast
						close={closeDialog}
						state={state}
						onChangeState={setState}
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

export default function ContentApp({ isOpen, email }: ContentProps) {
	const styles = extractStyles();
	return useShadow(<ShadowContentApp isOpen={isOpen} email={email} />, [], {
		styleContent: styles,
	});
}
