import Divider from "../Divider";
import Button, {Variant} from "../../../common/Button";
import expandIcon from "../../../public/expand-icon.png";
import TextField from "../../../common/TextField";

interface FormProps {
  setCreateForm: (value: boolean) => void;
}

const Form = ({setCreateForm}: FormProps) => {
  return (
    <div className={"flex-1"}>
      <Divider />
      <div className={'flex h-full flex-col justify-between'}>
        <div className={"p-4"}>
          <div className={"mb-8"}>
            <TextField variant={"title"} className={"mb-1"}>
              Demo Name
            </TextField>
            <input className={"border rounded-lg h-11 px-3 w-full"} />
          </div>
          <div>
            <TextField variant={"title"} className={"mb-1"}>
              Customer
            </TextField>
            <input className={"border rounded-lg h-11 px-3 w-full"} />
          </div>
          <div className={"mt-[42px] flex justify-end gap-4"}>
            <Button  onClick={() => setCreateForm(false)} variant={Variant.secondary}>
              Cancel
            </Button>
            <Button onClick={() => setCreateForm(false)}>
              Save Demo
            </Button>
          </div>
        </div>
        <div className={'flex self-end p-2'}>
          <img src={expandIcon} alt={'expandIcon'} />
        </div>
      </div>
    </div>
  )
}

export default Form;
