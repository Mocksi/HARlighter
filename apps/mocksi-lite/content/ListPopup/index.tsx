import { useContext, useState, useEffect, Fragment } from "react";
import type { Recording } from "../../background";
import Button from "../../common/Button";
import Divider from "../../common/Popup/Divider";
import { getRecordingsStorage } from "../../utils";
import { AppStateContext, AppState, AppEvent } from "../AppStateContext";
import Form from "../CreatePopup/Form";
import DemoItem from "./DemoItem";
import Popup from "../../common/Popup";


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

	const handleCreateDemoClicked = () => {
		dispatch({ event: AppEvent.CREATE_DEMO });
	}
	
	return (
		<Popup shouldDisplayFooter email={email} onLogout={onLogout} onChat={onChat} onClose={onClose}>
		<div className={"flex flex-1 flex-col h-[280px] overflow-x-scroll"}>
			{recordings.length ? (
				<div
					className={"flex-1 flex flex-col py-8 overflow-y-scroll no-scrollbar"}
				>
					{recordings
						.filter((record) => record.url)
						.map((record) => (
							<Fragment key={`demo-item-${record.uuid}`}>
								<DemoItem {...record} />
								<div className={"px-3 w-full my-6"}>
									<Divider />
								</div>
							</Fragment>
						))}
				</div>
			) : null}
			<Button
				onClick={handleCreateDemoClicked}
				className={!recordings.length ? "mt-3 self-center" : "my-3 self-center"}
			>
				Create New Demo
			</Button>
		</div>
		</Popup>
	);
};

export default ListPopup;
