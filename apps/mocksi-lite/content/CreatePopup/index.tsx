import { useContext } from "react";
import Popup from "../../common/Popup";
import { AppEvent, AppStateContext } from "../AppStateContext";
import Form from "./Form";

interface CreatePopupProps {
	onClose: () => void;
}

const CreatePopup = ({ onClose }: CreatePopupProps) => {
	const { dispatch } = useContext(AppStateContext);

	const handleCreateFormSubmit = () => {
		dispatch({ event: AppEvent.SAVE_DEMO });
	};

	const handleCreateFormCancel = () => {
		dispatch({ event: AppEvent.DISCARD_DEMO });
	};

	return (
		<Popup headerSubtitle="Create Demo" onClose={onClose}>
			<Form
				onCancel={handleCreateFormCancel}
				onSubmit={handleCreateFormSubmit}
			/>
		</Popup>
	);
};

export default CreatePopup;
