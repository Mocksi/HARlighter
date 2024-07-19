import { Fragment, useContext, useEffect, useState } from "react";
import type { Recording } from "../../background";
import Button from "../../common/Button";
import Divider from "../../common/Divider";
import Popup from "../../common/Popup";
import { getRecordingsStorage, sendMessage } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import DemoItem from "./DemoItem";

interface ListPopupProps {
	onClose: () => void;
	onChat: () => void;
	onLogout: () => void;
	email?: string;
}

const ListPopup = ({ email, onChat, onClose, onLogout }: ListPopupProps) => {
	const { dispatch } = useContext(AppStateContext);
	const [recordings, setRecordings] = useState<Recording[]>([]);

	const getRecordings = async () => {
		sendMessage("getRecordings", {}, (response) => {
			const { body } = response;
			const { recordings } = body as { recordings: Recording[] };

			setRecordings(recordings);
		})
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
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
			shouldDisplayFooter
			email={email}
			onSettings={handleSettingsClicked}
			onLogout={onLogout}
			onChat={onChat}
			onClose={onClose}
		>
			<div className="mw-flex mw-flex-1 mw-flex-col mw-h-[280px] mw-overflow-x-scroll">
				{recordings.length ? (
					<div className="mw-flex-1 mw-flex mw-flex-col mw-py-8 mw-overflow-y-scroll">
						{recordings
							.filter((record) => record.url)
							.map((record) => (
								<Fragment key={`demo-item-${record.uuid}`}>
									<DemoItem {...record} />
									<div className="mw-px-3 mw-w-full mw-my-6">
										<Divider />
									</div>
								</Fragment>
							))}
					</div>
				) : null}
				<Button
					onClick={handleCreateDemoClicked}
					className={
						!recordings.length ? "mw-mt-3 self-center" : "mw-my-3 self-center"
					}
				>
					Create New Demo
				</Button>
			</div>
		</Popup>
	);
};

export default ListPopup;
