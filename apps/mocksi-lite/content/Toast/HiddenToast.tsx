import TextField from "../../common/TextField";
import Divider from "../Popup/Divider";
import Button, {Variant} from "../../common/Button";
import {RecordingState} from "../../consts";
import Toast from "./index";
import {setEditorMode} from "../EditMode/editMode";
import {sendMessage} from "../../utils";

interface HiddenToastProps {
  close: () => void;
  onChangeState: (r: RecordingState) => void;
}

const HiddenToast = ({onChangeState, close}: HiddenToastProps) => {
  const handleEdit = () => {
    sendMessage("resetIcon");
    onChangeState(RecordingState.EDITING);
    setEditorMode(true);
  };

  const handleClose = () => {
    sendMessage("resetIcon");
    onChangeState(RecordingState.CREATE);
    close();
  };
  return (
    <Toast className="flex-col py-4 w-[244px] mr-6 mt-1">
      <div className="flex flex-col gap-1 items-center mb-4">
        <TextField variant={"title"}>
          demo name
        </TextField>
        <TextField>
          customer nbame
        </TextField>
      </div>
      <Divider />
      <div className="flex flex-col items-center gap-1 mt-4">
        <Button onClick={handleEdit}>
          Edit Demo
        </Button>
        <Button variant={Variant.secondary} onClick={handleClose}>
          Close Mocksi
        </Button>
      </div>
    </Toast>
  )
}

export default HiddenToast;
