import type { ReactNode } from "react";

interface ToastProps {
	children: ReactNode;
	className?: string;
	backgroundColor?: string;
}

const Toast = ({ backgroundColor, className, children }: ToastProps) => {
	const bgColor = backgroundColor ?? "bg-white";
	return (
		<div
			className={`border border-solid border-grey/40 rounded ${bgColor} flex flex-row items-center ${
				className ?? ""
			}`}
		>
			{children}
		</div>
	);
};

export default Toast;
