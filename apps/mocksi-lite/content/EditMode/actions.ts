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
	oldValue: string
) {
	if (nodeWithTextArea) {
		// const previousNode = nodeWithTextArea?.cloneNode(true)
		// const asd = previousNode?.parentElement?.replaceChild(
			// 	document.createTextNode(oldValue),
			// 	previousNode
			// )
		const parentElement = nodeWithTextArea?.parentElement;
		const previousText = nodeWithTextArea?.parentElement?.innerText || ""
		nodeWithTextArea?.parentElement?.replaceChild(
			document.createTextNode(newValue),
			nodeWithTextArea,
		);
		saveModification(
			parentElement as HTMLElement,
			parentElement?.innerHTML || parentElement?.innerText || "",
			previousText
		);
		parentElement?.normalize();
	}
}
