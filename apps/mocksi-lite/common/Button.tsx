import { CloseIcon } from "./Icons";

export function CloseButton({
	onClick,
	onKeyUp,
}: {
	onClick: () => void;
	onKeyUp?: (event?: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
	function handleKeyUp(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (onKeyUp) {
			onKeyUp(event);
		} else {
			event.key === "Escape" && onClick();
		}
	}

	return (
		<ButtonIconSmall onClick={onClick} onKeyUp={handleKeyUp}>
			<CloseIcon />
		</ButtonIconSmall>
	);
}

export function ButtonIconSmall({
	children,
	onClick,
	onKeyUp,
}: {
	children: React.ReactNode;
	onClick: () => void;
	onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
	return (
		<button
			className="mw-flex mw-flex-shrink-0 mw-justify-center mw-bg-[#F3F0EF] mw-p-1.5 mw-border-none mw-rounded-full mw-align-center mw-outline-none mw-cursor-pointer"
			onClick={onClick}
			onKeyUp={onKeyUp}
			type="button"
		>
			{children}
		</button>
	);
}

export enum Variant {
	primary = "primary",
	secondary = "secondary",
	icon = "icon",
}
interface ButtonProps {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
	variant?: Variant;
	onClick: () => void;
}

const getButtonStyles = (variant: Variant) => {
	switch (variant) {
		case Variant.icon:
			return "mw-bg-[#E8F3EC] mw-border-[#E8F3EC] mw-py-[10px] mw-px-[12px] mw-min-w-[28px] mw-max-w-[28px] mw-min-h-[32px] mw-max-h-[32px]";
		case Variant.primary:
			return "mw-bg-[#E8F3EC] !mw-min-h-[42px] mw-border-[#E8F3EC] mw-px-6";
		case Variant.secondary:
			return "mw-border-[#009875] !mw-min-h-[42px] mw-px-6 mw-min-w-[100px]";
		default:
			return "mw-bg-[#E8F3EC] !mw-min-h-[42px] mw-border-[#E8F3EC] mw-px-6";
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
	const buttonClassNames = `mw-border mw-text-[#009875] mw-rounded-full mw-flex mw-flex-row mw-flex-nowrap mw-items-center mw-justify-center ${
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
