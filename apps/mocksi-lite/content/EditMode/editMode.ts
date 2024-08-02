import { MOCKSI_READONLY_STATE, MOCKSI_RECORDING_ID } from "../../consts";
import {
	getAlterations,
	loadAlterations,
	persistModifications,
	sendMessage,
	undoModifications,
} from "../../utils";
import { applyImageChanges, cancelEditWithoutChanges } from "./actions";
import { decorate } from "./decorator";

const observeUrlChange = (onChange: () => void) => {
	let oldHref = document.location.href;
	const body = document.querySelector("body");

	if (!body) {
		console.error("body not found");
		return;
	}

	const observer = new MutationObserver((mutations) => {
		if (oldHref !== document.location.href) {
			oldHref = document.location.href;
			onChange();
		}
	});
	observer.observe(body, { childList: true, subtree: true });
};

export const setEditorMode = async (turnOn: boolean, recordingId?: string) => {
	if (turnOn) {
		setupEditor(recordingId);
	} else {
		teardownEditor(recordingId);
	}
};

const setupEditor = async (recordingId?: string) => {
	sendMessage("attachDebugger");

	if (recordingId) {
		await chrome.storage.local.set({ [MOCKSI_RECORDING_ID]: recordingId });
	}

	observeUrlChange(() => {
		console.log("URL changed, turning off highlights");
		getAlterations().then((alterations) => {
			loadAlterations(alterations, true);
		});
	});

	const results = await chrome.storage.local.get([MOCKSI_READONLY_STATE]);

	// If value exists and is true or if the value doesn't exist at all, apply read-only mode
	if (
		results[MOCKSI_READONLY_STATE] === undefined ||
		results[MOCKSI_READONLY_STATE]
	) {
		applyReadOnlyMode();
	}

	document.body.addEventListener("dblclick", onDoubleClickText);

	return;
};

const teardownEditor = async (recordingId?: string) => {
	sendMessage("detachDebugger");

	if (recordingId) {
		await persistModifications(recordingId);
	}

	undoModifications();

	await chrome.storage.local.remove([
		MOCKSI_RECORDING_ID,
		MOCKSI_READONLY_STATE,
	]);

	document.body.removeEventListener("dblclick", onDoubleClickText);
	disableReadOnlyMode();

	cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
};

function onDoubleClickText(event: MouseEvent) {
	// @ts-ignore MouseEvent typing seems incomplete
	const nodeName = event?.toElement?.nodeName;
	console.log("we double clicked on", event.target);

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

		if (selection?.toString()?.trim()) {
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
	onSubmit?: () => void,
	onCancel?: () => void,
) {
	const fragment = document.createDocumentFragment();
	if (startOffset > 0) {
		fragment.appendChild(
			document.createTextNode(text.substring(0, startOffset)),
		);
	}
	fragment.appendChild(
		decorate(text.substring(startOffset, endOffset), width, shiftMode, {
			onSubmit,
			onCancel,
		}),
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
	onSubmit?: () => void,
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
				onSubmit,
			),
			selectedRange.anchorNode,
		);
	}
}

const injectStylesToBlockEvents = () => {
	const style = document.createElement("style");
	style.id = "mocksi-block-events-style";
	style.innerHTML = `
		a, button, img, input, textarea, select, option, checkbox, radio, label {
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
