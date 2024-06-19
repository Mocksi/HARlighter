import { ShadowDOMManipulator } from "@repo/dodom";

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
		cancelEditWithoutChanges(nodeWithTextArea);
		const shadow = nodeWithTextArea.shadowRoot;
		if (!shadow) {
			console.log("Could not create shadow");
			return;
		}
		const manipulator = new ShadowDOMManipulator(shadow);
		manipulator.addPattern(oldValue, newValue);
		manipulator.applyPatterns(); // TODO: verify this is necessary
		nodeWithTextArea.innerHTML = '';
		for (const child of shadow.children) {
			nodeWithTextArea.appendChild(child.cloneNode(true));
		}
	}
}

export function fragmentTextNode(
	fragmentsToHighlight: Node[],
	matches: RegExpMatchArray[],
	textNode: Node,
	newText: string,
) {
	if (!textNode.nodeValue) {
		return null;
	}
	const baseFragment = document.createDocumentFragment();
	let cursor = 0;
	let index = 0;
	for (const match of matches) {
		// match.index may be undefined? in which cases?????
		const [startOffset, endOffset] = [
			match.index || 0,
			(match.index || 0) + match[0].length,
		];
		if (cursor < startOffset) {
			baseFragment.appendChild(
				document.createTextNode(
					textNode.nodeValue.substring(cursor, startOffset),
				),
			);
		}
		const selectedTextFragment = document.createTextNode(newText);
		fragmentsToHighlight.push(selectedTextFragment);
		baseFragment.appendChild(selectedTextFragment);
		cursor = endOffset;
		if (index === matches.length - 1 && cursor !== textNode.nodeValue?.length) {
			// end of matches
			baseFragment.appendChild(
				document.createTextNode(
					textNode.nodeValue.substring(endOffset, textNode.nodeValue?.length),
				),
			);
		}
		index++;
	}
	return baseFragment;
}
