import TextField from "../../common/TextField";
import { CloseButton } from "../Button";
import Divider from "../Divider";
import { LeftArrowIcon, TrashIcon } from "../Icons";
import { Logo } from "../Logos";

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
			<div className="mw-flex mw-flex-row mw-justify-start mw-items-center mw-px-3 mw-h-[45px]">
				<CloseButton onClick={close} />
			</div>
			<Divider />
			<div className="mw-flex mw-justify-center mw-items-center mw-mt-5">
				{onGoBack && (
					<div
						className="mw-left-16 mw-absolute mw-cursor-pointer"
						onClick={onGoBack}
						onKeyUp={(event) => {
							event.key === "Enter" && onGoBack();
						}}
					>
						<LeftArrowIcon />
					</div>
				)}
				<div className="mw-flex mw-flex-col mw-justify-center mw-items-center mw-gap-[5px]">
					<div>
						<Logo />
					</div>
					{subtitle && <TextField variant="title">{subtitle}</TextField>}
				</div>
				{onSettings && (
					<div
						className="mw-right-14 mw-absolute mw-cursor-pointer"
						onClick={onSettings}
						onKeyUp={(event) => {
							event.key === "Enter" && onSettings();
						}}
					>
						<TrashIcon />
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
