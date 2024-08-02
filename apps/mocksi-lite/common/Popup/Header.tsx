import TextField from "../../common/TextField";
import backIcon from "../../public/back-icon.png";
import closeIcon from "../../public/close-icon.png";
import labeledIcon from "../../public/labeled-icon.png";
import menuIcon from "../../public/menu-icon.png";
import trashIcon from "../../public/trash-icon.png";
import Divider from "../Divider";

interface HeaderProps {
	shouldDisplaySettings?: string;
	subtitle?: string;
	close: () => void;
	onGoBack?: () => void;
	onSettings?: () => void;
}

const Header = ({ close, onGoBack, onSettings, subtitle }: HeaderProps) => {
	return (
		<div>
			<div className="mw-flex mw-flex-row mw-items-center mw-px-2 mw-h-[36px]">
				<div
					className="mw-cursor-pointer"
					onClick={close}
					onKeyUp={(event) => {
						event.key === "Escape" && close();
					}}
				>
					<img alt="closeIcon" src={closeIcon} />
				</div>
				<div className="mw-flex mw-justify-center mw-mr-[20px] mw-w-full drag-handle">
					<img alt="menuIcon" draggable="false" src={menuIcon} />
				</div>
			</div>
			<Divider />
			<div className="mw-flex mw-justify-center mw-items-center mw-mt-5">
				{onGoBack && (
					<div
						className="mw-left-9 mw-absolute mw-cursor-pointer"
						onClick={onGoBack}
						onKeyUp={(event) => {
							event.key === "Enter" && onGoBack();
						}}
					>
						<img alt={"backIcon"} className="mw-w-[16px]" src={backIcon} />
					</div>
				)}
				<div className="mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-[5px]">
					<div>
						<img alt={"labeledIcon"} src={labeledIcon} />
					</div>
					{subtitle && <TextField variant="title">{subtitle}</TextField>}
				</div>
				{onSettings && (
					<div
						className="mw-right-9 mw-absolute mw-cursor-pointer"
						onClick={onSettings}
						onKeyUp={(event) => {
							event.key === "Enter" && onSettings();
						}}
					>
						<img alt={"trashIcon"} src={trashIcon} />
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
