import { MOCKSI_RECORDING_STATE, RecordingState } from "../../consts";
import { cancelEditWithoutChanges } from "./actions";
import { decorate } from "./decorator";

const blockedNodes: any[] = []

const blockNodes = () => {
    const aElements = document.querySelectorAll('a')
    const buttonElements = document.querySelectorAll('button')
    for (let clickableElement of [...aElements, ...buttonElements]) {
        //@ts-ignore
        const {href, className, style, onclick} = clickableElement
        blockedNodes.push({href, className, onclick, style: {...style}})
        //@ts-ignore
        clickableElement.href = ''
        clickableElement.style.cursor = 'text'
        clickableElement.onclick = (event) => {
            event.stopPropagation()
            event.preventDefault()
            console.log('BLOCKED!')
        }
    }
}

const restoreNodes = () => {
    const aElements = document.querySelectorAll('a')
    const buttonElements = document.querySelectorAll('button')
    let index = 0
    for (let readonlyElem of [...aElements, ...buttonElements]) {
        const {href, style, onclick} = blockedNodes[index]
        //@ts-ignore
        readonlyElem.href = href
        //@ts-ignore
        readonlyElem.style.cursor = style.cursor
        //@ts-ignore
        readonlyElem.onclick = onclick
        index++
    }
}

export const setEditorMode = (turnOn: boolean) => {
	if (turnOn) {
		localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.EDITING);
		blockNodes()
		document.body.addEventListener("dblclick", onDoubleClickText);
	} else {
		localStorage.setItem(MOCKSI_RECORDING_STATE, RecordingState.CREATE);
		document.body.removeEventListener("dblclick", onDoubleClickText);
        restoreNodes()
        cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"))
	}
};


function onDoubleClickText(event: MouseEvent) {
	// @ts-ignore MouseEvent typing seems incomplete
	if (event?.toElement?.nodeName !== "TEXTAREA") {
		cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"))
		const targetedElement: HTMLElement = event.target as HTMLElement;
		const selection = window.getSelection();
		if (selection?.toString()) {
			applyEditor(targetedElement, selection, event.shiftKey);
			document.getElementById("mocksiTextArea")?.focus();
		} else {
            decorateClickable(targetedElement)
			console.log("ERROR! no selection detected", targetedElement);
		}
	}
}

function decorateClickable(
    targetedElement: HTMLElement,
) {
    targetedElement.appendChild(
        decorate(targetedElement.innerText, '', false)
    )
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
				//@ts-ignore
				if (node.innerHTML) {
					// I don't know which case can enter here, made it just in case. Probably this get removed
					//@ts-ignore
					node.innerHTML = decorateTextTag(
						selectedRange.anchorNode?.textContent || "",
						targetedElement.clientWidth?.toString() || "",
						shiftMode,
						selectedRange.getRangeAt(0),
					);
				} else {
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
		}
	} else {
		// TODO
	}
}