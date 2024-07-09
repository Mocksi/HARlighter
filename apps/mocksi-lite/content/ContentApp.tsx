import { useContext, useState } from "react";
import useShadow from "use-shadow-dom";
import { MOCKSI_RECORDING_STATE, RecordingState } from "../consts";
import { setRootPosition } from "../utils";
import Popup from "./Popup";
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
