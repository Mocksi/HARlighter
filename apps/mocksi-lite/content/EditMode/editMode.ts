import {
	MOCKSI_RECORDING_ID,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "../../consts";
import { persistModifications, undoModifications } from "../../utils";
import { cancelEditWithoutChanges } from "./actions";
import { decorate } from "./decorator";
import { ContentHighlighter, initHighlighter } from "./highlighter";

export const setEditorMode = (turnOn: boolean, recordingId?: string) => {
	if (turnOn) {
		if (recordingId) localStorage.setItem(MOCKSI_RECORDING_ID, recordingId);
		localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.EDITING);
		blockNodes();
		initHighlighter();
		document.body.addEventListener("dblclick", onDoubleClickText);
	} else {
		if (recordingId) {
			persistModifications(recordingId);
		}
		undoModifications();
		localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.CREATE);
		localStorage.removeItem(MOCKSI_RECORDING_ID);
		document.body.removeEventListener("dblclick", onDoubleClickText);
		restoreNodes();
		ContentHighlighter.removeHighlightNodes();
		cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		document.normalize();
	}
};

function onDoubleClickText(event: MouseEvent) {
	// @ts-ignore MouseEvent typing seems incomplete
	if (event?.toElement?.nodeName !== "TEXTAREA") {
		cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		const targetedElement: HTMLElement = event.target as HTMLElement;
		const selection = window.getSelection();
		if (selection?.toString()) {
			applyEditor(targetedElement, selection, event.shiftKey);
			document.getElementById("mocksiTextArea")?.focus();
		} else {
			decorateClickable(targetedElement);
			document.getElementById("mocksiTextArea")?.focus();
		}
	}
}

function decorateClickable(targetedElement: HTMLElement) {
	const [textNode] = targetedElement.childNodes;
	targetedElement.replaceChild(
		decorate(
			textNode.textContent || "",
			`${targetedElement.clientWidth}`,
			false,
		),
		textNode,
	);
}

function decorateTextTag(
	text: string,
	width: string,
	shiftMode: boolean,
	{ startOffset, endOffset }: { startOffset: number; endOffset: number },
) {
	const fragment = document.createDocumentFragment();
	if (startOffset > 0)
		fragment.appendChild(
			document.createTextNode(text.substring(0, startOffset)),
		);
	fragment.appendChild(
		decorate(text.substring(startOffset, endOffset), width, shiftMode),
	);
	if (endOffset < text.length)
		fragment.appendChild(
			document.createTextNode(text.substring(endOffset, text.length)),
		);
	return fragment;
}

function applyEditor(
	targetedElement: HTMLElement,
	selectedRange: Selection | null,
	shiftMode: boolean,
) {
	if (selectedRange === null || selectedRange.anchorNode === null) return;
	// this case is if the beggining node is the same as the finished one.
	// this can happen while selecting text, there are more than one different node involved.
	if (selectedRange.anchorNode === selectedRange.focusNode) {
		for (const node of targetedElement.childNodes) {
			if (
				node === selectedRange.anchorNode ||
				[...node.childNodes].includes(selectedRange.anchorNode as ChildNode)
			) {
				// @ts-ignore
				targetedElement.replaceChild(
					decorateTextTag(
						selectedRange.anchorNode?.textContent || "",
						targetedElement.clientWidth?.toString() || "",
						shiftMode,
						selectedRange.getRangeAt(0),
					), // new node
					node,
				);
			}
		}
	} else {
		// TODO
	}
}

//biome-ignore lint/suspicious/noExplicitAny: need to look after a proper type, but mainly are html nodes
const blockedNodes: any[] = [];

const blockNodes = () => {
	const aElements = document.querySelectorAll("a");
	const buttonElements = document.querySelectorAll("button");
	for (const clickableElement of [...aElements, ...buttonElements]) {
		//@ts-ignore
		const { href, className, style, onclick } = clickableElement;
		blockedNodes.push({ href, className, onclick, style: { ...style } });
		//@ts-ignore
		clickableElement.href = "";
		clickableElement.style.cursor = "text";
		clickableElement.onclick = (event) => {
			event.stopPropagation();
			event.preventDefault();
			console.log("BLOCKED!");
		};
	}
};

const restoreNodes = () => {
	if (blockedNodes.length > 0) {
		const aElements = document.querySelectorAll("a");
		const buttonElements = document.querySelectorAll("button");
		let index = 0;
		for (const readonlyElem of [...aElements, ...buttonElements]) {
			const { href, style, onclick } = blockedNodes[index];
			//@ts-ignore
			readonlyElem.href = href;
			//@ts-ignore
			readonlyElem.style.cursor = style.cursor;
			//@ts-ignore
			readonlyElem.onclick = onclick;
			index++;
		}
	}
};
