import closeIcon from "../public/close-icon.png";
import menuIcon from "../public/menu-icon.png";
import labeledIcon from "../public/labeled-icon.png";
import {RecordButton} from "./RecordButton";
import {popupContent, popupTitle, RecordingState} from "../consts";
import {logout} from "../utils";


interface PopupProps {
  close: () => void;
  label: string;
  email: string;
  setState: (r: RecordingState) => void;
  state: RecordingState
}

const Popup = ({email, label, close, setState, state}: PopupProps) => {
  return (
    <div className={'max-w-[375px] shadow-lg rounded-lg m-4 bg-white'}>
      {/* HEADER */}
      <div className={'h-[36px] flex items-center justify-center flex-row'}>
        <div
          className="cursor-pointer absolute left-6"
          onClick={close}
          onKeyUp={(event) => {
            event.key === "esc" && close();
          }}
        >
          <img src={closeIcon} alt="closeIcon" />
        </div>
        <img src={menuIcon} alt="menuIcon" />
      </div>

      <div className={'h-px bg-[#E5E2E1]'} />

      {/* RECORD BUTTON */}
      <div className={'flex flex-col justify-center items-center gap-6 mt-5'}>
        <img src={labeledIcon} alt={'labeledIcon'} className={'mb-12'} />
        <RecordButton state={state} onRecordChange={setState} />
        <div className={'text-[15px]'}>{label}</div>
      </div>

      {/* CONTENT */}
      <div className={'flex flex-col p-6 gap-6'}>
        <div className={'text-[17px] font-medium'}>
          {popupTitle}
        </div>
        {
          popupContent.map(({title, text}, index) => (
            <div key={`text-item-${index}`}>
              <div className={'text-[15px] font-medium'}>
                {title}
              </div>
              <div className={'text-[15px]'}>
                {text}
              </div>
            </div>
          ))
        }
      </div>

      <div className={'h-px bg-[#E5E2E1]'} />

      {/* FOOTER */}
      <div className={'h-[36px] flex items-center justify-end pr-3'}>
        <div className={'text-[13px] text-[#5E5E5E] mr-2'}>
          {email}
        </div>
        <div id={'remove-cookies'} className={'text-[13px] text-[#006C52] underline cursor-pointer'} onClick={logout}>
          Sign Out
        </div>
      </div>
    </div>
  )
}

export default Popup;
