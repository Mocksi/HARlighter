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
	disabled?: boolean;
}

const getButtonStyles = (variant: Variant) => {
	switch (variant) {
		case Variant.primary:
			return "bg-[#E8F3EC] border-[#E8F3EC] px-6";
		case Variant.icon:
			return "bg-[#E8F3EC] border-[#E8F3EC] p-3 !max-h-[42px] !h-[42px]";
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
	disabled,
}: ButtonProps) => {
	const styles = getButtonStyles(variant);
	return (
		<div
			className={`border text-[#009875] w-fit !min-h-[42px] rounded-full flex items-center justify-center ${
				disabled ? "cursor-not-allowed" : "cursor-pointer"
			} ${styles} ${className ?? ""}`}
			onClick={!disabled ? onClick : undefined}
			onKeyUp={(event) => {
				event.key === "Enter" && onClick();
			}}
		>
			{children}
		</div>
	);
};

export default Button;
