import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observeUrlChange } from "./utils/observeUrlChange";

export default function useImages(editing: boolean) {
	const [edits, setEdits] = useState<Record<string, string>>({});
	const abortControllerRef = useRef(new AbortController());

	function applyEdits() {
		const editedImages: NodeListOf<HTMLImageElement> =
			document.querySelectorAll("img[data-mocksi-edited]");
		for (const image of editedImages) {
			if (image) {
				const src = image.getAttribute("data-mocksi-demo-src");
				if (src) {
					image.setAttribute("src", src);
				}
			}
		}
	}

	function undoEdits() {
		const editedImages: NodeListOf<HTMLImageElement> =
			document.querySelectorAll("img[data-mocksi-edited]");
		for (const image of editedImages) {
			if (image) {
				const src = image.getAttribute("data-mocksi-init-src");
				if (src) {
					image.setAttribute("src", src);
				}
			}
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

	const openImageUploadModal = (
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

		function closeImageUploadModal() {
			console.log("close modal!!", modalContainer);
			shadowRoot.removeChild(modalContent);
			if (modalContainer) {
				document.body.removeChild(modalContainer);
			}
		}

		// Add event listeners to the buttons
		uploadButton.addEventListener("click", () => {
			const file = imageInput.files?.[0];
			if (file) {
				convertImageToDataUri(file)
					.then((newSrc) => {
						if (targetImage.srcset) {
							targetImage.removeAttribute("srcset");
						}
						const src = targetImage.getAttribute("src");
						if (src) {
							onChange(src, newSrc);
						}
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
	};

	function storeEdits() {
		chrome.storage.local.get("mocksi-images", (storage) => {
			const allStoredEdits = storage["mocksi-images"];
			chrome.storage.local.set({
				"mocksi-images": {
					...(allStoredEdits ?? {}),
					[document.location.hostname]: edits,
				},
			});
		});
	}

	function createEdit(oldSrc: string, newSrc: string) {
		if (!oldSrc || !newSrc) {
			console.debug("cannot create edit, old or new src undefined");
			return;
		}
		// |= syntax checks if src contains exact string
		const elements = document.querySelectorAll(`img[src|='${oldSrc}']`);
		if (elements) {
			setEdits((prev) => {
				return { ...prev, [oldSrc]: newSrc };
			});

			for (const element of elements) {
				// has been edited already, just update demo src
				if (element.hasAttribute("data-mocksi-edited")) {
					element.setAttribute("data-mocksi-demo-src", newSrc);
				} else {
					// new image edited add data attributes
					element.setAttribute("data-mocksi-edited", "true");
					element.setAttribute("data-mocksi-init-src", oldSrc);
					element.setAttribute("data-mocksi-demo-src", newSrc);
				}
			}

			applyEdits();
		}
	}

	function setup() {
		chrome.storage.local.get("mocksi-images", (value) => {
			const storedEdits = value["mocksi-images"];
			// edits are stored by hostname
			const { hostname } = document.location;
			const localEdits = storedEdits?.[hostname] ?? {};
			let storedEditsExist = false;

			if (Object.keys(localEdits).length > 0) {
				storedEditsExist = true;
				setEdits(localEdits);
			}

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
					const src = image.getAttribute("src");
					// image has been edited before, add data attributes
					if (storedEditsExist && src) {
						if (localEdits[src]) {
							console.log("image found with existing src!!!!!");
							console.log("init src: ", src);
							console.log("demo src: ", localEdits[src].slice(0, 50));
							image.setAttribute("data-mocksi-edited", "true");
							image.setAttribute("data-mocksi-init-src", src);
							image.setAttribute("data-mocksi-demo-src", localEdits[src]);
						}
					}

					if (editing) {
						const parent = image.parentNode;

						const handleDoubleClick: EventListener = (event) => {
							event.stopPropagation();
							openImageUploadModal(image, createEdit);
						};

						parent?.addEventListener("dblclick", handleDoubleClick, {
							signal,
						});
						image.addEventListener("dblclick", handleDoubleClick, { signal });
					}
				}
			}

			if (storedEditsExist) {
				applyEdits();
			}
		});
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: only run this on mount
	useEffect(() => {
		const disconnect = observeUrlChange(() => {
			setup();
		});

		return () => {
			disconnect();

			// remove all the event listeners we added
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	return {
		applyEdits,
		createEdit,
		edits,
		setEdits,
		setup,
		storeEdits,
		undoEdits,
	};
}
