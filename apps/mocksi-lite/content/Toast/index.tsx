import type { ReactNode } from "react";

interface ToastProps {
	children: ReactNode;
	className?: string;
}

const Toast = ({ className, children }: ToastProps) => {
	return (
		<div
			className={`border border-solid border-grey/40 rounded bg-white flex flex-row items-center ${
				className ?? ""
			}`}
		>
			{children}
		</div>
	);
};

export default Toast;
