import { v4 as uuidv4 } from "uuid";

const MOCKSI_HIGHLIGHTER_ID = "mocksi-highlighter";

class Highlighter {
  private contentRanger = document.createRange();
  private highlightedNodes: { highlightedElem: Node; highlightId: string }[] =
    [];

  highlightNode = (elementToHighlight: Node) => {
    this.contentRanger.selectNodeContents(elementToHighlight);
    const { height, width, x, y } =
      this.contentRanger.getBoundingClientRect() || {};
    const textHighlight = highlight({
      height,
      highlightedElement: elementToHighlight,
      width,
      x,
      y,
    });
    textHighlight.id = uuidv4();
    document.body.appendChild(textHighlight);
    //@ts-ignore just don't know what is meaning here
    this.highlightedNodes.push({
      highlightId: textHighlight.id,
      highlightedElem: elementToHighlight,
    });
  };

  removeHighlightNode = (elementToUnhighlight: Node) => {
    const { highlightId } =
      this.highlightedNodes.find(
        ({ highlightedElem }) => highlightedElem === elementToUnhighlight,
      ) || {};
    if (highlightId) {
      const highlightDOMElem = document.getElementById(highlightId);
      highlightDOMElem?.remove();
    }
  };

  showHideHighlight = (show: boolean, elementInvolved: Node) => {
    const { highlightId } =
      this.highlightedNodes.find(
        ({ highlightedElem }) => highlightedElem === elementInvolved,
      ) || {};
    if (highlightId) {
      const highlightDOMElem = document.getElementById(highlightId);
      (highlightDOMElem as HTMLElement).style.display = show ? "block" : "none";
    }
  };

  showHideHighlights = (show: boolean) => {
    for (const node of document.querySelectorAll(
      `div.${MOCKSI_HIGHLIGHTER_ID}`,
    )) {
      (node as HTMLElement).style.display = show ? "block" : "none";
    }
  };

  removeHighlightNodes = () => {
    for (const node of document.querySelectorAll(
      `div.${MOCKSI_HIGHLIGHTER_ID}`,
    )) {
      (node as HTMLElement).remove();
    }
  };
}

let ContentHighlighter: Highlighter;

export const getHighlighter = () => {
  if (!ContentHighlighter) {
    ContentHighlighter = new Highlighter();
  }
  return ContentHighlighter;
};

const createHighlighterStyles = (
  width: number,
  height: number,
  x: number,
  y: number,
  scrollY: number,
  scrollX: number,
) => ({
  background: "rgba(229, 111, 12, 0.05)",
  border: "2px solid #FFB68B",
  cursor: "text",
  height: `${height}px`,
  left: `${window.scrollX + x + -2}px`,
  pointerEvents: "none",
  position: "absolute",
  top: `${window.scrollY + y + -2}px`,
  width: `${width}px`,
  zIndex: "999",
});

const highlight = ({
  height,
  highlightedElement,
  width,
  x,
  y,
}: {
  height: number;
  highlightedElement: Node;
  width: number;
  x: number;
  y: number;
}) => {
  const highlighterStyles = createHighlighterStyles(
    width,
    height,
    x,
    y,
    window.scrollY,
    window.scrollX,
  );
  const highlightDiv = document.createElement("div");
  highlightDiv.className = MOCKSI_HIGHLIGHTER_ID;

  highlightDiv.ondblclick = (event: MouseEvent) => {
    if (!highlightedElement?.parentElement) {
      return;
    }
    (event.target as HTMLElement).style.display = "none";
    // TODO: Come back to handle double clicking on a highlight
    document.getElementById("mocksiTextArea")?.focus();
    event.stopPropagation();
  };
  return highlightDiv;
};
