import {RecordButton} from "../RecordButton";
import {popupContent, popupTitle, RecordingState} from "../../consts";

interface RecordDemoProps {
  label: string;
  state: RecordingState;
  setState: (s: RecordingState) => void;
}

const RecordDemo = ({label, state, setState}: RecordDemoProps) => {
  return (
    <>
      <div className={"flex flex-col justify-center items-center gap-6 mt-[66px]"}>
        <RecordButton state={state} onRecordChange={setState} />
        <div className={"text-[15px]"}>{label}</div>
      </div>

      <div className={"flex flex-col p-6 gap-6"}>
        <div className={"text-[17px] font-medium leading-5"}>{popupTitle}</div>
        {popupContent.map(({ title, text }) => (
          <div key={`text-item-${title}`}>
            <div className={"text-[15px] font-medium leading-[18px]"}>{title}</div>
            <div className={"text-[15px] leading-[18px]"}>{text}</div>
          </div>
        ))}
      </div>
    </>
  )
}

export default RecordDemo;
