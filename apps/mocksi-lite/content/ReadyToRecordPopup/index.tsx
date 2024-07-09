import Popup from "../../common/Popup";
import RecordDemo from "./RecordDemo";

interface ReadyToRecordPopupProps {
	email?: string;
  onClose: () => void;
  onChat: () => void;
  onLogout: () => void;
}

const ReadyToRecordPopup = ({ email, onClose, onChat, onLogout }: ReadyToRecordPopupProps) => {
	return (
		<Popup onClose={close} email={email} onChat={onChat} onLogout={onLogout}>
      <RecordDemo />
    </Popup>
	);
};

export default ReadyToRecordPopup;
