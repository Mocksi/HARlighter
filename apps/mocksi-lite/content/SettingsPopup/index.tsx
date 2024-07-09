import { Fragment, useContext, useEffect, useState } from "react";
import type { Recording } from "../../background";
import Button from "../../common/Button";
import Divider from "../../common/Divider";
import Popup from "../../common/Popup";
import { getRecordingsStorage } from "../../utils";
import { AppEvent, AppState, AppStateContext } from "../AppStateContext";
import SettingsItem from "./SettingsItem";

interface SettingsPopupProps {
	onClose: () => void;
	onChat: () => void;
	onLogout: () => void;
	email?: string;
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
			headerSubtitle="Settings"
			shouldDisplayFooter
			email={email}
			onLogout={onLogout}
			onChat={onChat}
			onClose={onClose}
			onGoBack={handleGoBackClicked}
		>
			<div className={"flex flex-1 flex-col h-[280px] overflow-x-scroll"}>
				{recordings.length ? (
					<div
						className={
							"flex-1 flex flex-col py-8 overflow-y-scroll no-scrollbar"
						}
					>
						{recordings
							.filter((record) => record.url)
							.map((record) => (
								<Fragment key={`demo-item-${record.uuid}`}>
									<SettingsItem {...record} onDelete={handleDelete} />
									<div className={"px-3 w-full my-6"}>
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
