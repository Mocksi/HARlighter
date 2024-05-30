import closeIcon from "../../public/close-icon.png";
import menuIcon from "../../public/menu-icon.png";
import backIcon from "../../public/back-icon.png";
import labeledIcon from "../../public/labeled-icon.png";
import trashIcon from "../../public/trash-icon.png";
import Divider from "./Divider";

interface HeaderProps {
  close: () => void;
  onGoBack?: () => void;
  onDelete?: () => void;
}

const Header = ({close, onDelete, onGoBack}: HeaderProps) => {
  return (
    <div>
      <div className={"h-[36px] flex items-center justify-center flex-row"}>
        <div
          className="cursor-pointer absolute left-6"
          onClick={close}
          onKeyUp={(event) => {
            event.key === "Escape" && close();
          }}
        >
          <img src={closeIcon} alt="closeIcon" />
        </div>
        <img src={menuIcon} alt="menuIcon" />
      </div>

      <Divider />
      <div className={"flex justify-center items-center mt-5 mb-[13px]"}>
        {
          onGoBack &&
          <div className={"absolute left-9 cursor-pointer"} onClick={onGoBack}>
            <img src={backIcon} alt={"backIcon"} />
          </div>
        }
        <div className={'flex flex-col justify-center gap-[5px]'}>
          <img src={labeledIcon} alt={"labeledIcon"} />
          <div className={"text-[15px] leading-[18px]"}>
            Create New Demo
          </div>
        </div>
        {
          onDelete &&
          <div className={"absolute right-9 cursor-pointer"}>
            <img src={trashIcon} alt={"trashIcon"} />
          </div>
        }
      </div>
    </div>
  )
}

export default Header;
