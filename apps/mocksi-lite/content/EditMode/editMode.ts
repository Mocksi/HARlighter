import { MOCKSI_READONLY_STATE } from "../../consts";
import type { ApplyAlteration } from "../Toast/EditToast";
import { applyImageChanges } from "./actions";
import { decorate } from "./decorator";

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

function decorateTextTag(
	text: string,
	width: string,
	shiftMode: boolean,
	{ startOffset, endOffset }: { startOffset: number; endOffset: number },
	applyAlteration: ApplyAlteration,
) {
	const fragment = document.createDocumentFragment();
	if (startOffset > 0) {
		fragment.appendChild(
			document.createTextNode(text.substring(0, startOffset)),
		);
	}
	fragment.appendChild(
		decorate(
			text.substring(startOffset, endOffset),
			width,
			shiftMode,
			applyAlteration,
		),
	);
	if (endOffset < text.length) {
		fragment.appendChild(
			document.createTextNode(text.substring(endOffset, text.length)),
		);
	}
	return fragment;
}

export function applyEditor(
	targetedElement: HTMLElement,
	selectedRange: Selection | null,
	shiftMode: boolean,
	applyAlteration: ApplyAlteration,
) {
	if (selectedRange === null || selectedRange.anchorNode === null) {
		return;
	}

	if (selectedRange.anchorNode === selectedRange.focusNode) {
		selectedRange.anchorNode.parentElement?.replaceChild(
			decorateTextTag(
				selectedRange.anchorNode.textContent || "",
				targetedElement.clientWidth?.toString() || "",
				shiftMode,
				selectedRange.getRangeAt(0),
				applyAlteration,
			),
			selectedRange.anchorNode,
		);
	}
}

const BLOCKED_ELEMENTS = [
	'a',
	'button',
	'img',
	'input',
	'textarea',
	'select',
	'option',
	'checkbox',
	'radio',
	'label',
	'td',
	'div[type="button"]',
	'div[role="button"]'
]

const injectStylesToBlockEvents = () => {
	const style = document.createElement("style");
	style.id = "mocksi-block-events-style";

	const blockedSelector = BLOCKED_ELEMENTS.join(", ");
	style.innerHTML = `
		 ${blockedSelector} {
			pointer-events: none;
		}

		:is(#mocksi-editor-toast) * {
			pointer-events: unset;
		}
	`;
	document.head.appendChild(style);
};

const removeStylesToBlockEvents = () => {
	const style = document.getElementById("mocksi-block-events-style");
	if (style) {
		style.remove();
	}
};

export const applyReadOnlyMode = () => {
	chrome.storage.local.set({
		[MOCKSI_READONLY_STATE]: true,
	});
	injectStylesToBlockEvents();
};

export const disableReadOnlyMode = () => {
	chrome.storage.local.set({
		[MOCKSI_READONLY_STATE]: false,
	});
	removeStylesToBlockEvents();
};
