import type { ReactNode } from "react";

interface ToastProps {
	children: ReactNode;
	className?: string;
	backgroundColor?: string;
}

const Toast = ({ backgroundColor, className, children }: ToastProps) => {
	const bgColor = backgroundColor ?? "mw-bg-white";
	return (
		<div
			className={`mw-border mw-border-solid mw-border-grey/40 mw-rounded ${bgColor} mw-flex mw-flex-row mw-items-center ${
				className ?? ""
			}`}
		>
			{children}
		</div>
	);
};

export default Toast;
