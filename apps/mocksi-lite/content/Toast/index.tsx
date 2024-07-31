import type { ReactNode } from "react";

interface ToastProps {
	children: ReactNode;
	id?: string;
	className?: string;
	backgroundColor?: string;
}

const Toast = ({ backgroundColor, className, id, children }: ToastProps) => {
	const bgColor = backgroundColor ?? "mw-bg-white";
	return (
		<div
			id={id}
			className={`mw-border mw-border-solid mw-border-grey/40 mw-rounded ${bgColor} mw-flex mw-flex-row mw-items-center ${
				className ?? ""
			}`}
		>
			{children}
		</div>
	);
};

export default Toast;
