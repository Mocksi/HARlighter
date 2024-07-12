interface TextProps {
	children: string;
	className?: string;
	variant?: "regular" | "title";
}

const TextField = ({ children, variant = "regular", className }: TextProps) => {
	const title = variant === "title" ? "mw-font-medium" : "mw-font-[380]";
	return (
		<div
			className={`text-[15px] leading-[18px] text-black ${title} ${
				className ?? ""
			}`}
		>
			{children}
		</div>
	);
};

export default TextField;
