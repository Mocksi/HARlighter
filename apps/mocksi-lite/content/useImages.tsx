import { useCallback, useEffect, useRef, useState } from "react";

interface ImageEdit {
	[i: number]: {
		demoSrc: string;
		index: string;
		originalSrc: string;
	};
}

export default function useImages() {
	const [edits, setEdits] = useState<ImageEdit>({});
	const uploadModalOpenRef = useRef(-1);
	const abortControllerRef = useRef(new AbortController());

	const openImageUploadModal = useCallback(
		(
			targetImage: HTMLImageElement,
			onChange: (i: number, src: string) => void,
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
							targetImage.src = newSrc;
							const i = targetImage.getAttribute("data-mocksi-img");
							if (i) {
								onChange(Number.parseInt(i), newSrc);
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
				document.body.removeChild(modalContainer);
			}

			cancelButton.addEventListener("click", closeImageUploadModal, {
				once: true,
			});
		},
		[],
	);

	async function storeEdits() {
		const url = new URL(document.location.href);
		await chrome.storage.local.set({
			"mocksi-images": {
				[url.hostname]: {
					[url.pathname]: {
						imagesMap: edits,
						url: url.href,
					},
				},
			},
		});
	}

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
		const storedImages = storage["mocksi-images"];
		const url = new URL(document.location.href);
		const editsForHostname = storedImages?.[url.hostname];
		if (editsForHostname) {
			console.debug(`no stored images found for ${url.hostname}`);
			return;
		}
		return editsForHostname;
	}

	function undoImagesEdits() {
		return new Promise<void>((resolve) => {
			const images = document.images;
			if (!images.length) {
				resolve();
				return;
			}
			for (let i = 0; i < images.length; i++) {
				const image = images[i];
				const edit = edits[i];
				if (edit) {
					const src = edits[i].originalSrc;
					if (src) {
						// image.replaceWith(image.cloneNode(true)) TODO: look into using this
						image.src = edit.originalSrc;
					}
				}
			}
			resolve();
		});
	}

	useEffect(() => {
		const images = document.images;
		if (images.length) {
			console.error("No images found in document");
			return;
		}
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
				image.setAttribute("data-mocksi-img", i.toString());
				image.setAttribute("listener", "true");

				const parent = image.parentNode;

				const handleDoubleClick: EventListener = (event) => {
					event.stopPropagation();
					if (uploadModalOpenRef.current !== i) {
						function setDemoSrc(i: number, demoSrc: string) {
							setEdits((prevState) => {
								return {
									...prevState,
									[i]: {
										...prevState[i],
										demoSrc,
									},
								};
							});
						}

						openImageUploadModal(image, setDemoSrc);
						uploadModalOpenRef.current = i;
					}
				};

				parent?.addEventListener("dblclick", handleDoubleClick, { signal });
				image.addEventListener("dblclick", handleDoubleClick, { signal });
			}
		}

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [openImageUploadModal]);

	return {
		edits,
		getStoredEdits,
		setEdits,
		storeEdits,
	};
}
