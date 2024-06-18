import { MOCKSI_HIGHLIGHTER_ID } from "../../consts";

class Highlighter {
	private contentRanger = document.createRange();
	private highlightedNodes = [];

	highlightNode = (elementToHighlight: Node) => {
		this.contentRanger.selectNodeContents(elementToHighlight);
		const { x, y, width, height } =
			this.contentRanger.getBoundingClientRect() || {};
		const textHighlight = highlight({ x, y, width, height });
		document.body.appendChild(textHighlight);
		//@ts-ignore just don't know what is meaning here
		this.highlightedNodes.push(elementToHighlight);
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

export let ContentHighlighter: Highlighter;

export const initHighlighter = () => {
	if (!document.getElementById(MOCKSI_HIGHLIGHTER_ID)) {
		ContentHighlighter = new Highlighter();
	}
};

const highlight = ({
	x,
	y,
	width,
	height,
}: { x: number; y: number; width: number; height: number }) => {
	const highlightDiv = document.createElement("div");
	highlightDiv.className = MOCKSI_HIGHLIGHTER_ID;
	highlightDiv.style.position = "absolute";
	highlightDiv.style.top = `${window.scrollY + y + -2}px`;
	highlightDiv.style.left = `${window.scrollX + x + -2}px`;
	// 4px more because we're removing 2px each side because of the border
	highlightDiv.style.width = `${width + 4}px`;
	highlightDiv.style.height = `${height + 4}px`;
	highlightDiv.style.border = "2px solid purple";
	highlightDiv.style.backgroundColor = "transparent";
	return highlightDiv;
};
