// biome-ignore lint/style/useImportType: types are messy
import { ReactNode, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface IframeWrapperProps {
	children: ReactNode;
	styles?: string;
	scripts?: string[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	[x: string]: any;
}

const IframeWrapper = ({
	children,
	styles,
	scripts,
	...props
}: IframeWrapperProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null); // Explicitly type the ref
	const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null);

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

		// Inject styles
		if (styles) {
			const styleElement = iframeDocument.createElement("style");
			styleElement.textContent = styles;
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
            iframeDocument.body.style.setProperty('background-color', 'rgba(0, 0, 0, 0.0)');
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
