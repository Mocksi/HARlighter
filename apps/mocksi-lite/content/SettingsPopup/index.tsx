import { Fragment, useContext, useEffect, useState } from "react";
import type { Recording } from "../../background";
import Divider from "../../common/Divider";
import Popup from "../../common/Popup";
import { getRecordingsStorage } from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import SettingsItem from "./SettingsItem";

interface SettingsPopupProps {
	email?: string;
	onChat: () => void;
	onClose: () => void;
	onLogout: () => void;
}

const SettingsPopup = ({
	email,
	onChat,
	onClose,
	onLogout,
}: SettingsPopupProps) => {
	const { dispatch } = useContext(AppStateContext);
	const [recordings, setRecordings] = useState<Recording[]>([]);

	const getRecordings = async () => {
		let continueFetching = true;
		while (continueFetching) {
			try {
				const newRecordings = await getRecordingsStorage();
				if (newRecordings.length !== recordings.length) {
					setRecordings(newRecordings);
					continueFetching = false; // Stop the loop if recordings have been updated
				}
			} catch (error) {
				continueFetching = false; // Stop the loop in case of an error
			}
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		getRecordings();
	}, []);

	const handleGoBackClicked = () => {
		dispatch({ event: AppEvent.EXIT_SETTINGS });
	};

	const handleDelete = () => {
		getRecordings();
	};

	return (
		<Popup
			email={email}
			headerSubtitle="Settings"
			onChat={onChat}
			onClose={onClose}
			onGoBack={handleGoBackClicked}
			onLogout={onLogout}
			shouldDisplayFooter
		>
			<div className="mw-flex mw-flex-col mw-flex-1 mw-h-[280px] overflow-x-scroll">
				{recordings.length ? (
					<div className="mw-flex mw-flex-col mw-flex-1 mw-py-8 overflow-y-scroll no-scrollbar">
						{recordings
							.filter((record) => record.url)
							.map((record) => (
								<Fragment key={`demo-item-${record.uuid}`}>
									<SettingsItem {...record} onDelete={handleDelete} />
									<div className="mw-my-6 mw-px-3 mw-w-full">
										<Divider />
									</div>
								</Fragment>
							))}
					</div>
				) : null}
			</div>
		</Popup>
	);
};

export default SettingsPopup;
