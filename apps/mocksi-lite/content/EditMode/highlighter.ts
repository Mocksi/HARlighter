import { v4 as uuidv4 } from "uuid";
import { MOCKSI_HIGHLIGHTER_ID } from "../../consts";
import { decorate } from "./decorator";
import { applyStyles } from "./utils";
import { Highlighter } from "@repo/reactor";

class HighlighterImpl implements Highlighter {
	private contentRanger = document.createRange();
	private highlightedNodes: { highlightedElem: Node; highlightId: string }[] =
		[];

	highlightNode = (elementToHighlight: Node) => {
		this.contentRanger.selectNodeContents(elementToHighlight);
		const { x, y, width, height } =
			this.contentRanger.getBoundingClientRect() || {};
		const textHighlight = highlight({
			x,
			y,
			width,
			height,
			highlightedElement: elementToHighlight,
		});
		textHighlight.id = uuidv4();
		document.body.appendChild(textHighlight);
		//@ts-ignore just don't know what is meaning here
		this.highlightedNodes.push({
			highlightedElem: elementToHighlight,
			highlightId: textHighlight.id,
		});
	};

	removeHighlightNode = (elementToUnhighlight: Node) => {
		const { highlightId } =
			this.highlightedNodes.find(
				({ highlightedElem }) => highlightedElem === elementToUnhighlight,
			) || {};
		if (highlightId) {
			const highlightDOMElem = document.getElementById(highlightId);
			highlightDOMElem?.remove();
		}
	};

	showHideHighlight = (show: boolean, elementInvolved: Node) => {
		const { highlightId } =
			this.highlightedNodes.find(
				({ highlightedElem }) => highlightedElem === elementInvolved,
			) || {};
		if (highlightId) {
			const highlightDOMElem = document.getElementById(highlightId);
			(highlightDOMElem as HTMLElement).style.display = show ? "block" : "none";
		}
	};

	showHideHighlights = (show: boolean) => {
		for (const node of document.querySelectorAll(
			`div.${MOCKSI_HIGHLIGHTER_ID}`,
		)) {
			(node as HTMLElement).style.display = show ? "block" : "none";
		}
	};

	removeHighlightNodes = () => {
		for (const node of document.querySelectorAll(
			`div.${MOCKSI_HIGHLIGHTER_ID}`,
		)) {
			(node as HTMLElement).remove();
		}
	};
}

let ContentHighlighter: HighlighterImpl;

export const getHighlighter = () => {
	if (!ContentHighlighter) {
		ContentHighlighter = new HighlighterImpl();
	}
	return ContentHighlighter;
};

const createHighlighterStyles = (
	width: number,
	height: number,
	x: number,
	y: number,
	scrollY: number,
	scrollX: number,
) => ({
	position: "absolute",
	top: `${window.scrollY + y + -2}px`,
	left: `${window.scrollX + x + -2}px`,
	width: `${width}px`,
	height: `${height}px`,
	zIndex: "999",
	pointerEvents: "none",
	border: "2px solid #FFB68B",
	background: "rgba(229, 111, 12, 0.05)",
	cursor: "text",
});

const highlight = ({
	x,
	y,
	width,
	height,
	highlightedElement,
}: {
	x: number;
	y: number;
	width: number;
	height: number;
	highlightedElement: Node;
}) => {
	const highlighterStyles = createHighlighterStyles(
		width,
		height,
		x,
		y,
		window.scrollY,
		window.scrollX,
	);
	const highlightDiv = document.createElement("div");
	highlightDiv.className = MOCKSI_HIGHLIGHTER_ID;
	applyStyles(highlightDiv, highlighterStyles);

	highlightDiv.ondblclick = (event: MouseEvent) => {
		if (!highlightedElement?.parentElement) {
			return;
		}
		(event.target as HTMLElement).style.display = "none";
		highlightedElement.parentElement?.replaceChild(
			decorate(highlightedElement.textContent || "", `${width || ""}`, false, {
				onSubmit: undefined,
				onCancel: () => {
					(event.target as HTMLElement).style.display = "block";
				},
			}),
			highlightedElement,
		);
		document.getElementById("mocksiTextArea")?.focus();
		event.stopPropagation();
	};
	return highlightDiv;
};
