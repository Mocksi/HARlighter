import { saveModification } from "../../utils";
import { ContentHighlighter } from "./highlighter";

export function cancelEditWithoutChanges(nodeWithTextArea: HTMLElement | null) {
	if (nodeWithTextArea) {
		const parentElement = nodeWithTextArea?.parentElement;
		// cancel previous input.
		nodeWithTextArea?.parentElement?.replaceChild(
			document.createTextNode(nodeWithTextArea.innerText),
			nodeWithTextArea,
		);
		parentElement?.normalize();
	}
}

export function applyChanges(
	nodeWithTextArea: HTMLElement | null,
	newValue: string,
	oldValue: string,
) {
	if (nodeWithTextArea) {
		const parentElement = nodeWithTextArea?.parentElement;
		replaceValueInDOM(parentElement, nodeWithTextArea, newValue)
		saveModification(
			parentElement as HTMLElement,
			newValue,
			oldValue
		);
	}
}

function replaceValueInDOM(parentElement: HTMLElement | null, nodeWithTextArea: HTMLElement, newValue: string) {
	// const previousText = getPreviousNodeValue(nodeWithTextArea, oldValue);
	const nodeTextToReplace = document.createTextNode(newValue);
	parentElement?.replaceChild(
		nodeTextToReplace,
		nodeWithTextArea,
	);
	ContentHighlighter.highlightNode(nodeTextToReplace);
	parentElement?.normalize();
}

function getPreviousNodeValue(
	nodeWithTextArea: HTMLElement | null,
	oldValue: string,
) {
	if (nodeWithTextArea) {
		const clonedNode = nodeWithTextArea.parentElement?.cloneNode(true) as HTMLElement;
		for (const node of clonedNode?.childNodes || []) {
			if ((node as HTMLElement)?.id === "mocksiSelectedText") {
				clonedNode?.replaceChild(document.createTextNode(oldValue), node);
				clonedNode?.normalize();
				break;
			}
		}
		return clonedNode.innerHTML || "";
	}
}
