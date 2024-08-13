import { useCallback, useEffect, useRef, useState } from "react";
// import { MOCKSI_RECORDING_ID } from "../consts";

interface ImageEdit {
  [i: number]: {
    demoSrc: string;
    index: string;
    originalSrc: string;
  };
}

// TODO: check / associate MOCKSI_RECORDING_ID with edits see how alterations are handled

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
    await chrome.storage.local.set({
      "mocksi-images": {
        [document.location.hostname]: {
          [document.location.pathname]: {
            edits,
            url: document.location.href,
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
    const storedEdits = storage["mocksi-images"];
    console.log("chrome storage", storedEdits);
    return storedEdits;
  }

  function undoEdits() {
    return new Promise<void>((resolve) => {
      const images = window.document.images;
      console.log(edits);
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const edit = edits[i];
        if (edit && edit.originalSrc) {
          // image.replaceWith(image.cloneNode(true)) TODO: look into using this
          image.src = edit.originalSrc;
          console.log(edit, image);
        }
      }
      resolve();
    });
  }

  async function applyEdits() {
    const images = window.document.images;
    console.log("apply edits", edits);
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const edit = edits[i];
      if (image && edit) {
        image.setAttribute("data-mocksi-img", i.toString());
        const edit = edits[i];
        if (edit) {
          image.src = edit.demoSrc;
        }
      }
    }
  }

  function deleteEdits() {
    // remove edits for hostname or for recording id?
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
        image.setAttribute("data-mocksi-img", i.toString());
        image.setAttribute("listener", "true");

        const parent = image.parentNode;

        const handleDoubleClick: EventListener = (event) => {
          event.stopPropagation();
          if (uploadModalOpenRef.current !== i) {
            function setDemoSrc(i: number, demoSrc: string) {
              setEdits((prevState) => {
                prevState[i] = {
                  demoSrc,
                  index: i.toString(),
                  originalSrc: image.src,
                };
                console.log(prevState);
                return prevState;
              });

              console.log("edits stored locally post updates", edits);
            }

            openImageUploadModal(image, setDemoSrc);
            uploadModalOpenRef.current = i;
          }
        };

        parent?.addEventListener("dblclick", handleDoubleClick, { signal });
        image.addEventListener("dblclick", handleDoubleClick, { signal });
      }
    }
    console.log("images", images);
  }

  async function init() {
    const storedEdits = await getStoredEdits();
    console.log("storedEdits init", storedEdits);
    if (!storedEdits) {
      console.debug(`no existing edits for ${document.location.href}`);
      return;
    }

    const storedEditsForHostname = storedEdits[document.location.hostname];
    console.log(
      "(storedEditsForHostname[document.location.pathname]: ",
      storedEditsForHostname[document.location.pathname],
    );
    if (storedEditsForHostname[document.location.pathname]) {
      setEdits(storedEditsForHostname[document.location.pathname].edits);
      console.log("edit loaded from storage: ", edits);
    } else {
      console.debug("no edits stored for " + document.location.hostname);
    }
  }

  useEffect(() => {
    init();
    return () => {
      if (Object.keys(edits).length > 0) {
        storeEdits();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    applyEdits,
    edits,
    getStoredEdits,
    setEdits,
    setupDom,
    storeEdits,
    undoEdits,
  };
}
