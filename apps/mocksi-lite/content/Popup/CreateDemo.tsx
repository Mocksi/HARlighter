import Divider from "./Divider";
import Button from "./Button";
import expandIcon from "../../public/expand-icon.png";

interface CreateDemoProps {
  createForm: boolean;
  setCreateForm: (value: boolean) => void;
}

const CreateDemo = ({createForm, setCreateForm}: CreateDemoProps) => {
  return (
    <div className={"flex-1 flex justify-center"}>
      {
        createForm ?
          <div className={"flex-1"}>
            <Divider />
            <div className={'flex h-full flex-col justify-between'}>
              <div className={"p-4"}>
                <div className={"mb-8"}>
                  <div className={"text-[15px] leading-[18px] mb-1 font-medium"}>
                    Demo Name
                  </div>
                  <input className={"border rounded-lg h-11 px-3 w-full"} />
                </div>
                <div>
                  <div className={"text-[15px] leading-[18px] mb-1 font-medium"}>
                    Customer
                  </div>
                  <input className={"border rounded-lg h-11 px-3 w-full"} />
                </div>
                <div className={"mt-[42px] flex justify-end gap-4"}>
                  <Button  onClick={() => setCreateForm(false)} variant={'secondary'}>
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
          :
          <Button onClick={() => setCreateForm(true)}>
            Create New Demo
          </Button>
      }
    </div>
  )
}

export default CreateDemo;
