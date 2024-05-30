import Button from "../../../common/Button";
import Form from "../CreateDemo/Form";
import {useState} from "react";
import DemoItem from "./DemoItem";
import Divider from "../Divider";

interface CreateDemoProps {
  createForm: boolean;
  setCreateForm: (value: boolean) => void;
}

export interface Demo {
  id: number;
  name: string;
  customer: string;
  url?: string;
}

const mockedDemo = {
  id: 1,
  name: 'chatwoot.com - 1/27/24',
  customer: 'WealthWave Financial'
};

const CreateDemo = ({createForm, setCreateForm}: CreateDemoProps) => {
  const [demos, setDemos] = useState<Demo[]>([mockedDemo]);
  if (createForm) return <Form setCreateForm={setCreateForm} />
  return (
    <div className={"flex-1 flex flex-col items-center"}>
      {
        demos.map((demo) => <DemoItem key={`demo-item-${demo.id}`} {...demo} />)
      }
      <div className={'px-3 w-full mt-6'}>
        <Divider />
      </div>
      <Button onClick={() => setCreateForm(true)} className={"mt-[30px]"}>
        Create New Demo
      </Button>
    </div>
  )
}

export default CreateDemo;
