import Button from "../../../common/Button";
import Form from "../CreateDemo/Form";
import {useState} from "react";
import TextField from "../../../common/TextField";

interface CreateDemoProps {
  createForm: boolean;
  setCreateForm: (value: boolean) => void;
}

interface Demo {
  name: string;
  customer: string;
  url?: string;
}

const mockedDemo = {
  name: 'chatwoot.com - 1/27/24',
  customer: 'WealthWave Financial'
};

const CreateDemo = ({createForm, setCreateForm}: CreateDemoProps) => {
  const [demos, setDemos] = useState<Demo[]>([mockedDemo]);
  if (createForm) return <Form setCreateForm={setCreateForm} />
  return (
    <div className={"flex-1 flex flex-col items-center"}>
      {
        demos.map(({name, customer}) => (
          <div>
            <div>
              <TextField variant={'title'}>{name}</TextField>
              <TextField>{customer}</TextField>
            </div>

          </div>
        ))
      }
      <Button onClick={() => setCreateForm(true)} className={"mt-[30px]"}>
        Create New Demo
      </Button>
    </div>
  )
}

export default CreateDemo;
