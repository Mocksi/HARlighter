// biome-ignore lint/style/useImportType: types are messy
import { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { extractStyles } from "../utils";

interface IframeWrapperProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	[x: string]: any;
	children: ReactNode;
	scripts?: string[];
	styles?: string;
}

const IframeWrapper = ({
	children,
	scripts,
	styles,
	...props
}: IframeWrapperProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null); // Explicitly type the ref
	const [iframeBody, setIframeBody] = useState<null | HTMLElement>(null);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) {
			console.error("Iframe is null");
			return;
		}
		const iframeDocument = iframe.contentWindow?.document;
		if (!iframeDocument) {
			console.error("Iframe document is null");
			return;
		}

		let baseStyles = extractStyles(document.styleSheets);
		// Append component styles
		if (styles) {
			baseStyles += styles;
		}
		const styleElement = iframeDocument.createElement("style");
		if (styleElement && baseStyles) {
			styleElement.textContent = baseStyles;
			iframeDocument.head.appendChild(styleElement);
		}

		// Inject scripts
		if (scripts) {
			for (const script of scripts) {
				const scriptElement = iframeDocument.createElement("script");
				scriptElement.src = script;
				iframeDocument.head.appendChild(scriptElement);
			}
		}

		if (iframeDocument.body) {
			iframeDocument.body.style.setProperty(
				"background-color",
				"rgba(0, 0, 0, 0.0)",
			);
			iframeDocument.body.style.setProperty("min-width", "500px");
			setIframeBody(iframeDocument.body);
		}
	}, [styles, scripts]);

	return (
		<iframe ref={iframeRef} {...props} allowFullScreen>
			{iframeBody && ReactDOM.createPortal(children, iframeBody)}
		</iframe>
	);
};

export default IframeWrapper;
