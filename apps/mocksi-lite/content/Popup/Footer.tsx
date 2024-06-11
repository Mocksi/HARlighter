import { logout } from "../../utils";

const Footer = ({close}: {close: () => void}) => {
	return (
		<div className={"h-[36px] flex items-center justify-end pr-3"}>
			<div className={"text-[13px] text-[#5E5E5E] mr-2"}>jana@mocoso.com</div>
			<div
				className={"text-[13px] text-[#006C52] underline cursor-pointer"}
				onClick={() => {
          close();
          logout();
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
