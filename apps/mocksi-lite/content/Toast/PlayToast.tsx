import { useContext, useEffect, useState } from "react";
import type { Alteration } from "../../background";
import Button, { CloseButton, Variant } from "../../common/Button";
import { EditIcon, StopIcon } from "../../common/Icons";
import { Logo } from "../../common/Logos";
import { MOCKSI_ALTERATIONS, MOCKSI_RECORDING_CREATED_AT } from "../../consts";
import {
	getAlterations,
	loadAlterations,
	loadPreviousModifications,
	sendMessage,
	undoModifications,
} from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import { getHighlighter } from "../EditMode/highlighter";
import { observeUrlChange } from "../utils/observeUrlChange";
import Toast from "./index";

interface PlayToastProps {
	close: () => void;
}

const PlayToast = ({ close }: PlayToastProps) => {
	const { dispatch } = useContext(AppStateContext);
	const [alterations, setAlterations] = useState<Alteration[]>([]);
	const [url, setUrl] = useState<string>(document.location.href);

	useEffect(() => {
		chrome.storage.local
			.get([MOCKSI_ALTERATIONS, MOCKSI_RECORDING_CREATED_AT])
			.then((result) => {
				const alterations = result[MOCKSI_ALTERATIONS];
				setAlterations(alterations);

				const createdAt = result[MOCKSI_RECORDING_CREATED_AT];

				loadAlterations(alterations, {
					withHighlights: false,
					createdAt,
				});
			});

		const disconnect = observeUrlChange(() => {
			setUrl(document.location.href);
		});

		return () => {
			disconnect();
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: we dont use the url but want to run this whenever it changes
	useEffect(() => {
		getHighlighter().removeHighlightNodes();
		loadPreviousModifications(alterations);
		loadAlterations(alterations, { withHighlights: false });
	}, [url]);

	const handleEdit = () => {
		sendMessage("resetIcon");

		loadPreviousModifications(alterations);

		dispatch({ event: AppEvent.START_EDITING });
	};

	const handleHideToast = () => {
		sendMessage("updateToPauseIcon");
		dispatch({ event: AppEvent.START_PLAYING });
		close();
	};

	const handleStop = () => {
		sendMessage("resetIcon");
		undoModifications(alterations);
		dispatch({ event: AppEvent.STOP_PLAYING });
	};

	return (
		<Toast className="mw-gap-4 mw-m-2 mw-px-4 mw-py-3">
			<CloseButton onClick={handleHideToast} />
			<Logo />
			<div className="mw-flex mw-gap-2">
				<Button onClick={handleStop} variant={Variant.icon}>
					<StopIcon />
				</Button>
				<Button onClick={handleEdit} variant={Variant.icon}>
					<EditIcon />
				</Button>
			</div>
		</Toast>
	);
};

export default PlayToast;
