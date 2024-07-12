interface TextProps {
	children: string;
	className?: string;
	variant?: "regular" | "title";
}

const TextField = ({ children, variant = "regular", className }: TextProps) => {
	const title = variant === "title" ? "mw-font-medium" : "mw-font-[380]";
	const textFieldClassNames = `mw-text-[15px] mw-leading-[18px] mw-text-black ${title} ${
		className ?? ""
	}`;
	return (
		<div
			className={textFieldClassNames}
		>
			{children}
		</div>
	);
};

export default TextField;
