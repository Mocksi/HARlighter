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
		const previousText = getPreviousNodeValue(nodeWithTextArea, oldValue);
		const nodeTextToReplace = document.createTextNode(newValue)
		nodeWithTextArea?.parentElement?.replaceChild(
			nodeTextToReplace,
			nodeWithTextArea,
		);
		ContentHighlighter.highlightNode(nodeTextToReplace)
		saveModification(
			parentElement as HTMLElement,
			parentElement?.innerHTML || parentElement?.innerText || "",
			previousText || "",
		);
		parentElement?.normalize();
	}
}

// IDEAS TO HIGHLIGHT CHANGES
/* 
	1st create a div inside the BODY.
	2nd after change document.createRange() and range.selectNodeContents(changedNode);
	3rd range.getBoundingClientRect() we obtain the position and the width of the dom
	4th draw the square with the .getBoundingClientRect() data


	ALL OF THIS GETS LOST AFTER ALSO EVEN PERSISTING ON THE BACKEND.
	
	Compare prevText with nextText to get the actual modification text

	Things maybe I'd need to take care:
		window resizes.
		modifications inside the previous modifications.
*/

function getPreviousNodeValue(
	nodeWithTextArea: HTMLElement | null,
	oldValue: string,
) {
	if (nodeWithTextArea) {
		const ttt = nodeWithTextArea.parentElement?.cloneNode(true) as HTMLElement;
		for (const node of ttt?.childNodes || []) {
			// @ts-ignore
			if (node?.id === "mocksiSelectedText") {
				ttt?.replaceChild(document.createTextNode(oldValue), node);
				ttt?.normalize();
				break;
			}
		}
		return ttt.innerHTML || "";
	}
}
