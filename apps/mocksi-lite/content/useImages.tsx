import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { MOCKSI_RECORDING_ID } from "../consts";

// TODO: check / associate MOCKSI_RECORDING_ID with edits see how alterations are handled
export default function useImages() {
	const [edits, setEdits] = useState<Array<string>>([]);
	const uploadModalOpenRef = useRef(-1);
	const abortControllerRef = useRef(new AbortController());

	const openImageUploadModal = useCallback(
		(
			targetImage: HTMLImageElement,
			onChange: (prevSrc: string, src: string) => void,
		) => {
			if (!targetImage) {
				console.debug("no image was provided");
				return;
			}
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
			targetImage.focus();

			// Add event listeners to the buttons
			uploadButton.addEventListener("click", () => {
				const file = imageInput.files?.[0];
				if (file) {
					convertImageToDataUri(file)
						.then((newSrc) => {
							if (targetImage.srcset) {
								targetImage.removeAttribute("srcset");
							}
							const url = new URL(targetImage.src);
							if (url.hostname === document.location.hostname) {
								onChange(url.pathname, newSrc);
							} else {
								onChange(targetImage.src, newSrc);
							}
						})
						.catch((error) => {
							console.error("Error reading file:", error);
						});
					closeImageUploadModal();
				} else {
					console.error("No file selected.");
				}
			});

			function closeImageUploadModal() {
				if (modalContainer) {
					document.body.removeChild(modalContainer);
				}
			}

			cancelButton.addEventListener("click", closeImageUploadModal, {
				once: true,
			});
		},
		[],
	);

	async function storeEdits() {
		const storedEdits = await getStoredEdits();
		await chrome.storage.local.set({
			"mocksi-images": {
				...storedEdits,
				[document.location.hostname]: edits,
			},
		});
	}

	const editedImages: NodeListOf<HTMLImageElement> = useMemo(() => {
		return document.querySelectorAll("img[data-mocksi-edited]");
	}, [edits]);

	function convertImageToDataUri(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	async function getStoredEdits() {
		const storage = await chrome.storage.local.get("mocksi-images");
		const storedEdits = storage["mocksi-images"];
		if (!storedEdits) return [];
		const localEdits = storedEdits[document.location.hostname];
		return localEdits ?? [];
	}

	function undoEdits() {
		editedImages.forEach((image) => {
			if (image) {
				const src = image.getAttribute("data-mocksi-init-src");
				if (src) {
					image.src = src;
				}
			}
		});
	}

	function applyEdits() {
		editedImages.forEach((image) => {
			if (image) {
				const src = image.getAttribute("data-mocksi-demo-src");
				if (src) {
					image.src = src;
				}
			}
		});
	}

	async function deleteEdits() {
		const storedEdits = await getStoredEdits();
		await chrome.storage.local.set({
			"mocksi-images": {
				...storedEdits,
				[document.location.hostname]: [],
			},
		});
	}

	function createEdit(oldSrc: string, newSrc: string) {
		const elements = document.querySelectorAll(`img[src='${oldSrc}']`);
		if (elements) {
			let editExists = false;
			Array.from(elements).forEach((element) => {
				// has been edited already, just update demo src
				if (element.hasAttribute("data-mocksi-edited")) {
					element.setAttribute("data-mocksi-demo-src", newSrc);
					editExists = true;
				} else {
					element.setAttribute("data-mocksi-edited", "true");
					element.setAttribute("data-mocksi-init-src", oldSrc);
					element.setAttribute("data-mocksi-demo-src", newSrc);
				}
				console.debug(element.getAttributeNames());
			});
			if (!editExists) {
				setEdits((prev) => [...prev, oldSrc]);
			}
			applyEdits();
		}
	}

	function setupDom() {
		const images = window.document.images;
		// use to remove all event listeners on unmount
		const { signal } = abortControllerRef.current;
		if (!signal) {
			console.debug("abort controller undefined");
		}
		// add data attribute and double click handlers
		for (let i = 0; i < images.length; i++) {
			const image = images[i];

			// only edit visible image elements
			if (image.checkVisibility()) {
				const parent = image.parentNode;

				const handleDoubleClick: EventListener = (event) => {
					event.stopPropagation();
					if (uploadModalOpenRef.current !== i) {
						openImageUploadModal(image, createEdit);
						uploadModalOpenRef.current = i;
					}
				};

				parent?.addEventListener("dblclick", handleDoubleClick, { signal });
				image.addEventListener("dblclick", handleDoubleClick, { signal });
			}
		}
	}

	useEffect(() => {
		getStoredEdits().then((storedEdits) => {
			if (storedEdits) {
				setEdits(storedEdits);
			} else {
				console.debug("no stored edits");
			}
		});

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	useEffect(() => {
		applyEdits();
	}, [edits]);

	return {
		applyEdits,
		createEdit,
		deleteEdits,
		edits,
		getStoredEdits,
		setEdits,
		setupDom,
		storeEdits,
		undoEdits,
	};
}
