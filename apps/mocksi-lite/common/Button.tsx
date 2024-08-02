import type { ReactNode } from "react";

export enum Variant {
	primary = "primary",
	secondary = "secondary",
	icon = "icon",
}
interface ButtonProps {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	variant?: Variant;
	onClick: () => void;
}

const getButtonStyles = (variant: Variant) => {
	switch (variant) {
		case Variant.icon:
			return "mw-bg-[#E8F3EC] mw-border-[#E8F3EC] mw-py-0.75 mw-px-2.5 !mw-max-h-[42px] !mw-h-[42px]";
		case Variant.primary:
			return "mw-bg-[#E8F3EC] mw-border-[#E8F3EC] mw-px-6";
		case Variant.secondary:
			return "mw-border-[#009875] mw-px-6";
		default:
			return "mw-bg-[#E8F3EC] mw-border-[#E8F3EC] mw-px-6";
	}
};

const Button = ({
	children,
	className,
	disabled,
	onClick,
	variant = Variant.primary,
}: ButtonProps) => {
	const styles = getButtonStyles(variant);
	const buttonClassNames = `mw-border mw-text-[#009875] mw-w-fit !mw-min-h-[42px] mw-rounded-full mw-flex mw-items-center mw-justify-center ${
		disabled ? "mw-cursor-not-allowed" : "mw-cursor-pointer"
	} ${styles} ${className ?? ""}`;
	return (
		<div
			className={buttonClassNames}
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
