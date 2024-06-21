import Button from "../../common/Button";
import { MOCKSI_RECORDING_STATE, RecordingState } from "../../consts";
import { logout } from "../../utils";

const Footer = ({
	email,
	close,
}: { email: string | null; close: () => void }) => {
	const openChat = () => {
		chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: RecordingState.CHAT });
	};
	return (
		<div className={"h-[36px] flex items-center justify-end pr-3"}>
			<div className={"text-[13px] text-[#5E5E5E] mr-2"}>{email}</div>
			<Button className="btn btn-square" onClick={openChat}>
				Chat
			</Button>
			<div
				className={"text-[13px] text-[#006C52] underline cursor-pointer"}
				onClick={() => {
					close();
					logout();
				}}
				onKeyUp={(event) => {
					// todo think something better here
					event.key === "Enter" && (() => undefined);
				}}
			>
				Sign Out
			</div>
		</div>
	);
};

export default Footer;
