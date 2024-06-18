import UniversalReplace from '../../universalReplace'

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
		cancelEditWithoutChanges(nodeWithTextArea)
		UniversalReplace.addPattern(oldValue, newValue)
	}
}

export function fragmentTextNode(fragmentsToHighlight: Node[], matches: RegExpMatchArray[], textNode: Node, newText: string) {
	const baseFragment = document.createDocumentFragment()
	let cursor = 0;
	let index = 0;
	for (const match of matches) {
		// match.index may be undefined? in which cases?????
		const [startOffset, endOffset] = [match.index || 0, (match.index || 0) + match[0].length]
		if (cursor < startOffset) {
			baseFragment.appendChild(
				//@ts-ignore nodeValue wont be null
				document.createTextNode(textNode.nodeValue.substring(cursor, startOffset)),
			);
		}
		const selectedTextFragment = document.createTextNode(newText);
		fragmentsToHighlight.push(selectedTextFragment)
		baseFragment.appendChild(selectedTextFragment)
		cursor = endOffset
		if (index === matches.length - 1 && cursor !== textNode.nodeValue?.length) {
			// end of matches
			baseFragment.appendChild(
				//@ts-ignore nodeValue wont be null
				document.createTextNode(textNode.nodeValue.substring(endOffset, textNode.nodeValue?.length)),
			);
		}
		index++;
	}
	return baseFragment
}

function replaceValueInDOM(
	parentElement: HTMLElement | null,
	nodeWithTextArea: HTMLElement,
	newValue: string,
) {
	// const previousText = getPreviousNodeValue(nodeWithTextArea, oldValue);
	const nodeTextToReplace = document.createTextNode(newValue);
	parentElement?.replaceChild(nodeTextToReplace, nodeWithTextArea);
	parentElement?.normalize();
}

function getPreviousNodeValue(
	nodeWithTextArea: HTMLElement | null,
	oldValue: string,
) {
	if (nodeWithTextArea) {
		const clonedNode = nodeWithTextArea.parentElement?.cloneNode(
			true,
		) as HTMLElement;
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
