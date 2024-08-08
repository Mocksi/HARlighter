import { DOMManipulator } from "@repo/dodom";
import type { ModificationRequest } from "@repo/reactor";
import Reactor from "../../reactorSingleton";
import type { ApplyAlteration } from "../Toast/EditToast";
import { getHighlighter } from "./highlighter";

export function cancelEditWithoutChanges(
	nodeWithTextArea: HTMLElement | null,
): Text | null {
	if (nodeWithTextArea) {
		const parentElement = nodeWithTextArea?.parentElement;
		const newChild = document.createTextNode(nodeWithTextArea.innerText);

		// cancel previous input.
		nodeWithTextArea?.parentElement?.replaceChild(newChild, nodeWithTextArea);
		parentElement?.normalize();
		return newChild;
	}

	return null;
}

export function applyChanges(
	nodeWithTextArea: HTMLElement | null,
	newValue: string,
	oldValue: string,
	applyAlteration: ApplyAlteration,
) {
	if (nodeWithTextArea) {
		const newChildNode = cancelEditWithoutChanges(nodeWithTextArea);

		const modification: ModificationRequest = {
			description: `Change ${oldValue} to ${newValue}`,
			modifications: [
				{
					//selector: getCssSelector(newChildNode?.parentElement),
					selector: "body",
					action: "replaceAll",
					content: `/${oldValue}/${newValue}/`,
				},
			],
		};
		console.log(modification);

		Reactor.pushModification(modification);

		// TODO: check if we should keep the singleton behavior we had before
		// const domManipulator = new DOMManipulator(
		// 	fragmentTextNode,
		// 	getHighlighter(),
		// 	applyAlteration,
		// );
		// domManipulator.addPattern(oldValue, newValue);
	}
}

export function fragmentTextNode(
	fragmentsToHighlight: Node[],
	matches: RegExpMatchArray[],
	textNode: Node,
	newText: string,
) {
	const fragment = document.createDocumentFragment();
	if (!textNode.nodeValue) {
		return fragment;
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

export function applyImageChanges(
	targetedElement: HTMLImageElement,
	newSrc: string,
) {
	const domManipulator = new DOMManipulator(
		fragmentTextNode,
		getHighlighter(),
		() => {},
	);
	domManipulator.replaceImage(targetedElement.src, newSrc);
}
