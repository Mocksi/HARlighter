import type { ReactNode } from "react";

interface ToastProps {
	backgroundColor?: string;
	children: ReactNode;
	className?: string;
	id?: string;
}

const Toast = ({ backgroundColor, children, className, id }: ToastProps) => {
	const bgColor = backgroundColor ?? "mw-bg-white";
	return (
		<div
			className={`mw-border mw-border-solid mw-border-grey/40 mw-rounded ${bgColor} mw-flex mw-flex-row mw-items-center mw-content-evenly mw-min-w-[22
	  0px] mw-gap-4 ${className ?? ""}`}
			id={id}
		>
			{children}
		</div>
	);
};

export default Toast;
