import ReactDOM from "react-dom/client";
import ContentApp from "./ContentApp";

// IMPORTANT! Add css files to manifest.json!!

setTimeout(initial, 1000);

let root: ReactDOM.Root;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.text === "clickedIcon") {
		const extensionRoot = document.getElementById("extension-root");
		if (extensionRoot?.firstChild === null) {
			root = ReactDOM.createRoot(extensionRoot);
			root.render(<ContentApp isOpen={true} sessionCookie={msg.loginToken} />);
		} else {
			root.unmount();
		}
	}
});


function decorate(text: string) {
	// TODO! Detect if parent node was a plain text or a h1,h2,h3,h4,etc. To keep the previous element 
	let newSpan = document.createElement("span");
    newSpan.style.border = "3px orange solid";
	newSpan.id = 'mocksiSelectedText'
    newSpan.appendChild(document.createTextNode(text));
    return newSpan;
}

function decorateTextTag(text: string, {startOffset, endOffset}: {startOffset: number, endOffset: number}) {
	let fragment = document.createDocumentFragment();
	if(startOffset > 0) fragment.appendChild(document.createTextNode(text.substring(0, startOffset)));
	fragment.appendChild(decorate(text.substring(startOffset, endOffset)));
	if(endOffset < text.length) fragment.appendChild(document.createTextNode(text.substring(endOffset, text.length)));
	return fragment
}


function applyHighlight2(targetedElement: HTMLElement, selectedRange: any) {
	targetedElement.childNodes.forEach((node) => {
		if (node === selectedRange.anchorNode) {
			debugger
			//@ts-ignore
			if (node.innerHTML) {
				const appliedHigh = decorateTextTag(selectedRange.anchorNode.textContent, selectedRange.getRangeAt(0))
				//@ts-ignore
				node.innerHTML = appliedHigh
			}
			else {
				// @ts-ignore
				let fragment = decorateTextTag(selectedRange.anchorNode.textContent, selectedRange.getRangeAt(0))
				targetedElement.replaceChild(fragment, node)
			}
			
		}
	})
}

function onDoubleClickText(event: MouseEvent) {
	const previousSelectedText = document.getElementById('mocksiSelectedText')
	const targetedElement: HTMLElement = event.target as HTMLElement
	// TODO if user selected a space text, break
	// TODO2 if user the previously selected text, break
	if (previousSelectedText) {
		previousSelectedText.style.border = ''
		previousSelectedText.id = '' // see if there's a better way to do this
	}
	const {startOffset, endOffset} = window.getSelection()?.getRangeAt(0) || {}
	if (startOffset !== undefined && endOffset !== undefined) {
		applyHighlight2(targetedElement, window.getSelection())
	} else {
		console.log('ERROR! no offset detected', targetedElement)
	}
}

function initial() {
	// Create a new div element and append it to the document's body
	const rootDiv = document.createElement("div");
	rootDiv.id = "extension-root";
	document.body.appendChild(rootDiv);
	document.body.addEventListener("dblclick", onDoubleClickText);

	// Use `createRoot` to create a root, then render the <App /> component
	// Note that `createRoot` takes the container DOM node, not the React element
	root = ReactDOM.createRoot(rootDiv);
	root.render(<ContentApp />);
}
