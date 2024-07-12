import { useContext } from "react";
import Button, { Variant } from "../../common/Button";
import { logout } from "../../utils";

interface FooterProps {
	email: string | null;
	onChat: () => void;
	onLogout: () => void;
}

const Footer = ({ email, onChat, onLogout }: FooterProps) => {
	const buttonClassName =
		"mw-btn mw-btn-square mw-text-[13px] mw-flex mw-items-center mw-px-2";
	const iconClassName = "mw-mr-1 mw-w-4 mw-h-4 mw-flex-shrink-0"; // Adjust the icon size and margin as needed

	return (
		<div className="mw-h-[36px] mw-flex mw-items-center mw-justify-end mw-pr-3">
			<div className="mw-text-[13px] mw-text-[#5E5E5E] mw-mr-2">{email}</div>
			<div className="mw-text-[13px] mw-text-[#5E5E5E] mw-mr-2 mw-flex mw-items-center">
				<Button
					className={buttonClassName}
					variant={Variant.secondary}
					onClick={onChat}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.5"
						stroke="currentColor"
						className={iconClassName}
					>
						<title>Beaker</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
						/>
					</svg>
					<span>Open Mocksi AI</span>
				</Button>
			</div>
			<div
				className="mw-text-[13px] mw-text-[#006C52] mw-underline mw-cursor-pointer"
				onClick={() => {
					onLogout();
				}}
				onKeyUp={(event) => {
					// todo think something better here
					event.key === "Enter" && (() => undefined);
				}}
			>
				Sign Out
			</div>
		</div>
	);
};

export default Footer;
