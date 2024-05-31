import type { ReactNode } from "react";

export enum Variant {
	primary = "primary",
	secondary = "secondary",
	icon = "icon",
}
interface ButtonProps {
	children: ReactNode;
	onClick: () => void;
	variant?: Variant;
	className?: string;
}

const getButtonStyles = (variant: Variant) => {
	switch (variant) {
		case Variant.primary:
			return "bg-[#E8F3EC] border-[#E8F3EC] px-6";
		case Variant.icon:
			return "bg-[#E8F3EC] border-[#E8F3EC] p-3";
		case Variant.secondary:
			return "border-[#009875] px-6";
		default:
			return "bg-[#E8F3EC] border-[#E8F3EC] px-6";
	}
};
const Button = ({
	children,
	onClick,
	variant = Variant.primary,
	className,
}: ButtonProps) => {
	const styles = getButtonStyles(variant);
	return (
		<div
			className={`border text-[#009875] w-fit h-[42px] rounded-full flex items-center justify-center cursor-pointer ${styles} ${className}`}
			onClick={onClick}
			onKeyUp={(event) => {
				event.key === "Enter" && onClick();
			}}
		>
			{children}
		</div>
	);
};

export default Button;
