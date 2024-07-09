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
			<div className={"h-[36px] flex items-center flex-row px-2"}>
				<div
					className="cursor-pointer"
					onClick={close}
					onKeyUp={(event) => {
						event.key === "Escape" && close();
					}}
				>
					<img src={closeIcon} alt="closeIcon" />
				</div>
				<div className={"w-full mr-[20px] flex justify-center drag-handle"}>
					<img src={menuIcon} draggable="false" alt="menuIcon" />
				</div>
			</div>

			<Divider />
			<div className={"flex justify-center items-center mt-5"}>
				{onGoBack && (
					<div
						className={"absolute left-9 cursor-pointer"}
						onClick={onGoBack}
						onKeyUp={(event) => {
							event.key === "Enter" && onGoBack();
						}}
					>
						<img src={backIcon} alt={"backIcon"} className={"w-[16px]"} />
					</div>
				)}
				<div className={"flex flex-col justify-center items-center gap-[5px]"}>
					<div>
						<img src={labeledIcon} alt={"labeledIcon"} />
					</div>
					{subtitle && <TextField variant="title">{subtitle}</TextField>}
				</div>
				{onSettings && (
					<div
						className={"absolute right-9 cursor-pointer"}
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
