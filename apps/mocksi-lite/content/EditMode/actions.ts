import UniversalReplace from "../../universalReplace";
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
		nodeWithTextArea?.parentElement?.replaceChild(
			document.createTextNode(newValue),
			nodeWithTextArea,
		);
		console.log({ newValue });
		console.log({ oldValue });
		UniversalReplace.addPattern(oldValue, newValue);
		// saveModification(
		// 	parentElement as HTMLElement,
		// 	parentElement?.innerHTML || parentElement?.innerText || "",
		// );
		// parentElement?.normalize();
	}
}
