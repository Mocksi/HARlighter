import { RecordingState } from "../../consts";
import RecordDemo from "./RecordDemo";
import CreateDemo from "./CreateDemo";
import {useState} from "react";
import Header from "./Header";
import Divider from "./Divider";
import Footer from "./Footer";

interface PopupProps {
	close: () => void;
	label: string;
	setState: (r: RecordingState) => void;
	state: RecordingState;
}

const Popup = ({ label, close, setState, state }: PopupProps) => {
  const [createForm, setCreateForm] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<boolean>(false);
  const renderContent = () => {
    switch (state) {
      case RecordingState.CREATE:
        return <CreateDemo createForm={createForm} setCreateForm={setCreateForm} />
      case RecordingState.READY:
      default:
        return <RecordDemo label={label} state={state} setState={setState} />
    }
  };

	return (
		<div className={"w-[375px] h-[596px] shadow-lg rounded-lg m-4 bg-white flex flex-col justify-between"}>
      <Header createForm={createForm} close={close} onDelete={editForm ? () => {} : undefined} />

      {/* CONTENT */}
      {renderContent()}

      {/* FOOTER */}
      {
        !createForm &&
        <div>
          <Divider />
          <Footer />
        </div>
      }
		</div>
	);
};

export default Popup;
