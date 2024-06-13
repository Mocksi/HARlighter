import { saveModification } from "../../utils";

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
		const previousText = getPreviousNodeValue(nodeWithTextArea, oldValue)
		nodeWithTextArea?.parentElement?.replaceChild(
			document.createTextNode(newValue),
			nodeWithTextArea,
		);
		saveModification(
			parentElement as HTMLElement,
			parentElement?.innerHTML || parentElement?.innerText || "",
			previousText,
		);
		parentElement?.normalize();
	}
}


function getPreviousNodeValue(
	nodeWithTextArea: HTMLElement | null,
	oldValue: string
) {
	if (nodeWithTextArea) {
		const ttt = nodeWithTextArea.parentElement?.cloneNode(true) as HTMLElement
		for (const node of (ttt?.childNodes || [])) {
			// @ts-ignore
			if (node?.id === 'mocksiSelectedText') {
				ttt?.replaceChild(
					document.createTextNode(oldValue),
					node
				)
				ttt?.normalize()
				break;
			}
		}

		return ttt.innerHTML || ""
	} else {
		return ""
	}
}