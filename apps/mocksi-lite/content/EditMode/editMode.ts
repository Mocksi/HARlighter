import { MOCKSI_READONLY_STATE } from "../../consts";
import type { ApplyAlteration } from "../Toast/EditToast";
import { applyImageChanges } from "./actions";
import { decorate } from "./decorator";

function decorateTextTag(
  text: string,
  width: string,
  shiftMode: boolean,
  { endOffset, startOffset }: { endOffset: number; startOffset: number },
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
  selectedRange: null | Selection,
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
  "a",
  "button",
  "img",
  "input",
  "textarea",
  "select",
  "option",
  "checkbox",
  "radio",
  "label",
  "td",
  'div[type="button"]',
  'div[role="button"]',
];

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
