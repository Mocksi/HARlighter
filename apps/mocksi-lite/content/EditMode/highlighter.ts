import { v4 as uuidv4 } from "uuid";
import { MOCKSI_HIGHLIGHTER_ID } from "../../consts";
import { decorate } from "./decorator";

class Highlighter {
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

let ContentHighlighter: Highlighter;

export const getHighlighter = () => {
	if (!ContentHighlighter) {
		ContentHighlighter = new Highlighter();
	}
	return ContentHighlighter;
};

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
	const highlightDiv = document.createElement("div");
	highlightDiv.className = MOCKSI_HIGHLIGHTER_ID;
	highlightDiv.style.position = "mw-absolute";
	highlightDiv.style.top = `${window.scrollY + y + -2}px`;
	highlightDiv.style.left = `${window.scrollX + x + -2}px`;
	// 4px more because we're removing 2px each side because of the border
	highlightDiv.style.width = `${width + 4}px`;
	highlightDiv.style.height = `${height + 4}px`;
	highlightDiv.style.border = "2px solid purple";
	highlightDiv.style.backgroundColor = "transparent";
	highlightDiv.style.cursor = "text";
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
