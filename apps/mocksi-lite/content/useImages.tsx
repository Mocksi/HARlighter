import { useEffect, useRef, useState } from "react";
import { updateRecordingsStorage } from "../utils";

export default function useImages() {
  const [localImagesMap, setLocalImagesMap] = useState<
    Record<number, Record<string, string>>
  >({});

  const uploadImageModalOpenRef = useRef(-1);
  function playImagesEdits() {}

  function undoImagesEdits() {
    return new Promise<void>((resolve) => {
      const images = document.images;
      if (!images.length) {
        resolve();
        return;
      }
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const src: string = localImagesMap[i].originalSrc;
        if (src) {
          image.src = localImagesMap[i]?.originalSrc;
        }

        image.removeAttribute("data-mocksi-img");
      }
      resolve();
    });
  }

  function openImageUploadModal(
    targetedElement: HTMLImageElement,
    onChange: (i: number | string, src: string) => void,
  ) {
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
          .then((newSrc) => {
            if (targetedElement.srcset) {
              targetedElement.removeAttribute("srcset");
            }
            targetedElement.src = newSrc;
            const i = targetedElement.getAttribute("data-mocksi-img");
            if (i) {
              onChange(i, newSrc);
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

    cancelButton.addEventListener("click", closeImageUploadModal);
  }

  function convertImageToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function setImagesInStorage() {
    const url = new URL(document.location.href);

    await chrome.storage.local.set({
      "mocksi-images": {
        [url.hostname]: {
          [url.pathname]: {
            imagesMap: localImagesMap,
            url: url.href,
          },
        },
      },
    });
  }

  async function getStoredImagesEditsForHostname() {
    const storage = await chrome.storage.local.get("mocksi-images");
    const storedImagesMap = storage["mocksi-images"];
    const url = new URL(document.location.href);
    return storedImagesMap[url.hostname];
  }

  async function getStoredImagesEditsForPage() {
    const storedForHostname = await getStoredImagesEditsForHostname();
    const url = new URL(document.location.href);
    return storedForHostname[url.pathname];
  }

  async function setupImagesEditingState() {
    const images = document.images;
    const tempImagesMap: Record<
      number,
      { demoSrc: string; index: string; originalSrc: string }
    > = {};

    const existingEdits = await getStoredImagesEditsForPage();
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      // only edit visible image elements
      if (image.checkVisibility()) {
        const existingEdit = existingEdits[i];
        if (existingEdit) {
          tempImagesMap[i] = existingEdit;
        } else {
          tempImagesMap[i] = {
            demoSrc: "",
            index: i.toString(),
            originalSrc: image.src,
          };
        }

        image.setAttribute("data-mocksi-img", i.toString());
        image.setAttribute("listener", "true");

        const parent = image.parentNode;

        parent?.addEventListener(
          "dblclick",
          (event) => {
            event.stopPropagation();
            if (uploadImageModalOpenRef.current !== i) {
              openImageUploadModal(image, setDemoSrc);
              uploadImageModalOpenRef.current = i;
            }
          },
          false,
        );

        image.addEventListener(
          "dblclick",
          (event) => {
            event.stopPropagation();
            if (uploadImageModalOpenRef.current !== i) {
              openImageUploadModal(image, setDemoSrc);
              uploadImageModalOpenRef.current = i;
            }
          },
          false,
        );
      }
    }

    function setDemoSrc(i: number | string, demoSrc: string) {
      setLocalImagesMap((prevState) => {
        return {
          ...prevState,
          [i]: {
            // @ts-ignore
            ...prevState[i],
            demoSrc,
          },
        };
      });
    }

    // store image srcs on load so we can persist them
    setLocalImagesMap(tempImagesMap);
  }

  useEffect(() => {
    getStoredImagesEditsForHostname();
  }, []);

  return [localImagesMap, setLocalImagesMap, undoImagesEdits];
}
