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

const Header = ({ subtitle, close, onSettings, onGoBack }: HeaderProps) => {
	return (
		<div>
			<div
				className={"mw-h-[36px] mw-flex mw-items-center mw-flex-row mw-px-2"}
			>
				<div
					className="mw-cursor-pointer"
					onClick={close}
					onKeyUp={(event) => {
						event.key === "Escape" && close();
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<div
					className={
						"mw-w-full mw-mr-[20px] mw-flex mw-justify-center drag-handle"
					}
				>
					<img src={menuIcon} draggable="false" alt="menuIcon" />
				</div>
			</div>
			<Divider />
			<div className={"mw-flex mw-justify-center mw-items-center mw-mt-5"}>
				{onGoBack && (
					<div
						className={"mw-absolute mw-left-9 mw-cursor-pointer"}
						onClick={onGoBack}
						onKeyUp={(event) => {
							event.key === "Enter" && onGoBack();
						}}
					>
						<img src={backIcon} alt={"backIcon"} className={"mw-w-[16px]"} />
					</div>
				)}
				<div
					className={
						"mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-[5px]"
					}
				>
					<div>
						<img src={labeledIcon} alt={"labeledIcon"} />
					</div>
					{subtitle && <TextField variant="title">{subtitle}</TextField>}
				</div>
				{onSettings && (
					<div
						className={"mw-absolute mw-right-9 mw-cursor-pointer"}
						onClick={onSettings}
						onKeyUp={(event) => {
							event.key === "Enter" && onSettings();
						}}
					>
						<img src={trashIcon} alt={"trashIcon"} />
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
