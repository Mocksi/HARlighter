import {
	MOCKSI_RECORDING_ID,
	MOCKSI_RECORDING_STATE,
	RecordingState,
} from "../../consts";
import { persistModifications, undoModifications } from "../../utils";
import { applyImageChanges, cancelEditWithoutChanges } from "./actions";
import { decorate } from "./decorator";

export const setEditorMode = async (turnOn: boolean, recordingId?: string) => {
	if (turnOn) {
		if (recordingId) {
			await chrome.storage.local.set({ [MOCKSI_RECORDING_ID]: recordingId });
		}
		await chrome.storage.local.set({
			[MOCKSI_RECORDING_STATE]: RecordingState.EDITING,
		});
		blockClickableElements();
		document.body.addEventListener("dblclick", onDoubleClickText);
		return;
	}
	if (recordingId) {
		persistModifications(recordingId);
	}
	undoModifications();
	await chrome.storage.local.set({
		[MOCKSI_RECORDING_STATE]: RecordingState.CREATE,
	});
	await chrome.storage.local.remove(MOCKSI_RECORDING_ID);
	document.body.removeEventListener("dblclick", onDoubleClickText);
	restoreNodes();
	cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
	document.normalize();
};

function onDoubleClickText(event: MouseEvent) {
	// @ts-ignore MouseEvent typing seems incomplete
	const nodeName = event?.toElement?.nodeName;
	if (nodeName === "IMG") {
		const targetedElement: HTMLImageElement = event.target as HTMLImageElement;
		console.log("Image clicked", targetedElement.alt);
		openImageUploadModal(targetedElement);
		return;
	}
	if (nodeName !== "TEXTAREA") {
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

function openImageUploadModal(targetedElement: HTMLImageElement) {
	// Create a container for the shadow DOM
	const modalContainer = document.createElement("div");
	document.body.appendChild(modalContainer);

	// Attach a shadow root to the container
	const shadowRoot = modalContainer.attachShadow({ mode: "open" });

	// Create the modal content
	const modalContent = document.createElement("div");
	modalContent.innerHTML = `
        <div id="image-upload-modal" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc;">
            <h2>Upload New Image</h2>
            <input type="file" id="image-input" accept="image/*">
            <button id="upload-button">Upload</button>
            <button id="cancel-button">Cancel</button>
        </div>
    `;

	// Append the modal content to the shadow root
	shadowRoot.appendChild(modalContent);

	// Query the elements within the shadow DOM
	const imageInput = shadowRoot.querySelector(
		"#image-input",
	) as HTMLInputElement;
	const uploadButton = shadowRoot.querySelector(
		"#upload-button",
	) as HTMLButtonElement;
	const cancelButton = shadowRoot.querySelector(
		"#cancel-button",
	) as HTMLButtonElement;

	// Focus the targeted element
	targetedElement.focus();

	// Add event listeners to the buttons
	uploadButton.addEventListener("click", () => {
		const file = imageInput.files?.[0];
		if (file) {
			convertImageToDataUri(file)
				.then((dataUri) => {
					applyImageChanges(targetedElement, dataUri);
					closeImageUploadModal();
				})
				.catch((error) => {
					console.error("Error reading file:", error);
				});
		} else {
			console.error("No file selected.");
		}
	});

	cancelButton.addEventListener("click", closeImageUploadModal);

	function closeImageUploadModal() {
		document.body.removeChild(modalContainer);
	}
}

function closeImageUploadModal() {
	const modal = document.getElementById("image-upload-modal");
	if (modal) {
		modal.remove();
	}
}

function convertImageToDataUri(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function decorateClickable(targetedElement: HTMLElement) {
	const [textNode] = targetedElement.childNodes;
	if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
		return;
	}
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
	if (startOffset > 0) {
		fragment.appendChild(
			document.createTextNode(text.substring(0, startOffset)),
		);
	}
	fragment.appendChild(
		decorate(text.substring(startOffset, endOffset), width, shiftMode),
	);
	if (endOffset < text.length) {
		fragment.appendChild(
			document.createTextNode(text.substring(endOffset, text.length)),
		);
	}
	return fragment;
}

function applyEditor(
	targetedElement: HTMLElement,
	selectedRange: Selection | null,
	shiftMode: boolean,
) {
	if (selectedRange === null || selectedRange.anchorNode === null) {
		return;
	}
	if (selectedRange.anchorNode === selectedRange.focusNode) {
		for (const node of targetedElement.childNodes) {
			if (
				node === selectedRange.anchorNode ||
				[...node.childNodes].includes(selectedRange.anchorNode as ChildNode)
			) {
				targetedElement.replaceChild(
					decorateTextTag(
						selectedRange.anchorNode?.textContent || "",
						targetedElement.clientWidth?.toString() || "",
						shiftMode,
						selectedRange.getRangeAt(0),
					),
					node,
				);
			}
		}
	}
}

// biome-ignore lint/suspicious/noExplicitAny: need to look after a proper type, but mainly are html nodes
const blockedNodes: any[] = [];

const blockClickableElements = () => {
	const clickableElements = [
		...document.querySelectorAll("a"),
		...document.querySelectorAll("button"),
		...document.querySelectorAll("img"),
	];
	for (const clickableElement of clickableElements) {
		const { href, className, style, onclick, src } =
			clickableElement as HTMLAnchorElement &
				HTMLButtonElement &
				HTMLImageElement;
		blockedNodes.push({ href, className, onclick, style: { ...style }, src });
		if (clickableElement instanceof HTMLAnchorElement) {
			clickableElement.removeAttribute("href");
			clickableElement.removeAttribute("src");
		}
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
		const clickableElements = [
			...document.querySelectorAll("a"),
			...document.querySelectorAll("button"),
			...document.querySelectorAll("img"),
		];
		let index = 0;
		for (const readonlyElem of clickableElements) {
			if (blockedNodes[index]) {
				const { href, style, onclick, src } = blockedNodes[index];
				if (readonlyElem instanceof HTMLAnchorElement) {
					readonlyElem.href = href;
				} else if (readonlyElem instanceof HTMLImageElement) {
					readonlyElem.src = src;
				}
				readonlyElem.style.cursor = style.cursor;
				readonlyElem.onclick = onclick;
				index++;
			} else {
				break;
			}
		}
	}
};
