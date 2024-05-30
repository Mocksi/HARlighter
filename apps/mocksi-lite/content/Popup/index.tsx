import { RecordingState } from "../../consts";
import { logout } from "../../utils";
import RecordDemo from "./RecordDemo";
import CreateDemo from "./CreateDemo";
import {useState} from "react";
import Header from "./Header";
import Divider from "./Divider";

interface PopupProps {
	close: () => void;
	label: string;
	email: string;
	setState: (r: RecordingState) => void;
	state: RecordingState;
}

const Popup = ({ email, label, close, setState, state }: PopupProps) => {
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
      <Header close={close} onDelete={editForm ? () => {} : undefined} />

      {/* CONTENT */}
      {renderContent()}

      {/* FOOTER */}
      <div>
        <Divider />

        <div className={"h-[36px] flex items-center justify-end pr-3"}>
          <div className={"text-[13px] text-[#5E5E5E] mr-2"}>{email}</div>
          <div
            className={"text-[13px] text-[#006C52] underline cursor-pointer"}
            onClick={logout}
            onKeyUp={(event) => {
              // todo think something better here
              event.key === "Enter" && (() => undefined);
            }}
          >
            Sign Out
          </div>
        </div>
      </div>
		</div>
	);
};

export default Popup;
