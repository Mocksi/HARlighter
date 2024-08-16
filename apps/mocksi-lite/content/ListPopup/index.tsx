import { Fragment, useContext, useEffect, useRef, useState } from "react";
import type { Recording } from "../../background";
import Button from "../../common/Button";
import Divider from "../../common/Divider";
import Popup from "../../common/Popup";
import { sendMessage } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import DemoItem from "./DemoItem";

interface ListPopupProps {
	email?: string;
	onChat: () => void;
	onClose: () => void;
	onLogout: () => void;
}

const ListPopup = ({ email, onChat, onClose, onLogout }: ListPopupProps) => {
	const { dispatch } = useContext(AppStateContext);
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const hasImageEditsRef = useRef(false);

	const getRecordings = async () => {
		sendMessage("getRecordings", {}, (response) => {
			const { body } = response;
			const { recordings } = body as { recordings: Recording[] };

			setRecordings(recordings);
		});
	};

	// TODO: remove when we add images back to alterations

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		chrome.storage.local.get("mocksi-images", (storage) => {
			if (storage["mocksi-images"][document.location.hostname]) {
				hasImageEditsRef.current = true;
			}
		});
		getRecordings();
	}, []);

	const handleCreateDemoClicked = () => {
		dispatch({ event: AppEvent.CREATE_DEMO });
	};

	const handleSettingsClicked = () => {
		dispatch({ event: AppEvent.ENTER_SETTINGS });
	};

	return (
		<Popup
			email={email}
			onChat={onChat}
			onClose={onClose}
			onLogout={onLogout}
			onSettings={handleSettingsClicked}
			shouldDisplayFooter
		>
			<div className="mw-flex mw-flex-col mw-flex-1 mw-h-full mw-overflow-x-scroll">
				{recordings.length ? (
					<div className="mw-flex mw-flex-col mw-flex-1 mw-py-8 mw-overflow-y-scroll">
						{recordings
							.filter((record) => record.url)
							.map((record) => (
								<Fragment key={`demo-item-${record.uuid}`}>
									<DemoItem
										{...record}
										hasImageEdits={hasImageEditsRef.current}
									/>
									<div className="mw-my-6 mw-px-3">
										<Divider />
									</div>
								</Fragment>
							))}
					</div>
				) : null}
				<Button
					className={
						!recordings.length
							? "mw-mt-3 mw-self-center"
							: "mw-my-3 mw-self-center"
					}
					onClick={handleCreateDemoClicked}
				>
					Create New Demo
				</Button>
			</div>
		</Popup>
	);
};

export default ListPopup;
