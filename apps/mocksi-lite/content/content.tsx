import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";

let root: ReactDOM.Root;

function decorate(text: string, width: string, shiftMode: boolean) {
	const newSpan = document.createElement("span");
	newSpan.style.position = "relative";
	newSpan.id = "mocksiSelectedText";
	newSpan.appendChild(document.createTextNode(text));
	const textArea = elementWithBorder("textarea", shiftMode ? width : undefined, text)
	newSpan.appendChild(textArea);
	textArea.focus()
	return newSpan;
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

function applyHighlight(
	targetedElement: HTMLElement,
	selectedRange: Selection | null,
	shiftMode: boolean,
) {
	if (selectedRange === null || selectedRange.anchorNode === null) return;
	// this case is if the beggining node is the same as the finished one.
	// this can happen while selecting text, there are more than one different node involved.
	if (selectedRange.anchorNode === selectedRange.focusNode) {
		for (const node of targetedElement.childNodes) {
			if (node === selectedRange.anchorNode || [...node.childNodes].includes(selectedRange.anchorNode as ChildNode)) {
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

function elementWithBorder(elementType: string, width: string | undefined, value: string) {
	const ndiv = document.createElement(elementType || "div");
	ndiv.setAttribute("tabindex", "-1");
	const elementStyle = {
		width: width ? "120%" : "150%",
		height: "100%",
		border: "1px solid red",
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "999",
		background: "#f0f8ffa8"
	}
	ndiv.style.width = elementStyle.width;
	ndiv.style.height = elementStyle.height;
	ndiv.style.border = elementStyle.border;
	ndiv.style.position = elementStyle.position;
	ndiv.style.top = elementStyle.top;
	ndiv.style.left = elementStyle.left;
	ndiv.style.zIndex = elementStyle.zIndex;
	ndiv.style.background = elementStyle.background;
	ndiv.onkeydown = (event: KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			if (!event.repeat) {
				const newEvent = new Event("submit", {cancelable: true});
				event.target?.dispatchEvent(newEvent);
			}
			event.preventDefault(); // Prevents the addition of a new line in the text field
		} else if (event.key === "Escape") {
			const selectedText = document.getElementById("mocksiSelectedText")
			selectedText?.parentElement?.replaceChild(
				document.createTextNode(value),
				selectedText
			)
		}
	}
	ndiv.onsubmit = (event: SubmitEvent) => {
		const selectedText = document.getElementById("mocksiSelectedText")
		// @ts-ignore I don't know why the value property is no inside the target object
		const newValue = event.target?.value
		selectedText?.parentElement?.replaceChild(
			document.createTextNode(newValue),
			selectedText
		)
		// TODO Should we need to append all textNodes after replacing child? or is easier to handle multiple selected nodes?
	}
	// ndiv.onblur = () => {
	// 	const selectedText = document.getElementById("mocksiSelectedText")
	// 	selectedText?.parentElement?.replaceChild(
	// 		document.createTextNode(value),
	// 		selectedText
	// 	)
	// }

	//@ts-ignore
	ndiv.value = value
	ndiv.autofocus = true
	return ndiv;
}

function onDoubleClickText(event: MouseEvent) {
	// const previousSelectedText = document.getElementById("mocksiSelectedText");
	const targetedElement: HTMLElement = event.target as HTMLElement;
	const { startOffset, endOffset } = window.getSelection()?.getRangeAt(0) || {};
	debugger
	if (startOffset !== undefined && endOffset !== undefined) {
		applyHighlight(targetedElement, window.getSelection(), event.shiftKey);
	} else {
		console.log("ERROR! no offset detected", targetedElement);
	}
}

function initial() {
	const rootDiv =
		document.getElementById("extension-root") || document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);
	document.body.addEventListener("dblclick", onDoubleClickText);
}

document.addEventListener("DOMContentLoaded", initial);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	const extensionRoot = document.getElementById("extension-root");
	if (extensionRoot) {
		if (root) {
			root.unmount();
		}
		root = ReactDOM.createRoot(extensionRoot);
		root.render(<ContentApp isOpen={true} sessionCookie={msg.loginToken} />);
	}
	sendResponse({ status: "success" });
});


/* 
	TODO TEXT REPLACER:

	- Support multiple selected nodes (when user selects text and involves more than one node)
	- Autofocus when displaying new textarea!!! Only works on the first one ever.
	- Remove previous textarea when doubleclicking other text or on blur
*/