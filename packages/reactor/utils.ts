import { throws } from "assert";
const cssSelector = require("css-selector-generator");
import type {
	AppliedModifications,
	Modification,
	ModificationRequest,
	TimeStampReference,
} from "./interfaces";

export function parseRequest(userRequest: string): ModificationRequest {
	try {
		return JSON.parse(userRequest);
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		console.error("Error parsing user request:", error);
		throw new Error("Invalid user request format");
	}
}

abstract class AppliableModification {
	doc: Document;

	constructor(doc: Document) {
		this.doc = doc;
	}

	abstract apply(): void;
	abstract unapply(): void;
}

export class AppliedModificationsImpl implements AppliedModifications {
	modificationRequest: ModificationRequest;
	modifications: Array<AppliableModification> = [];

	constructor(modificationRequest: ModificationRequest) {
		this.modificationRequest = modificationRequest;
	}

	unapply(): void {
		const reversedModifications = [...this.modifications].reverse();
		for (const mod of reversedModifications) {
			mod.unapply();
		}
	}

	setHighlight(highlight: boolean): void {
		throw new Error("Method not implemented.");
	}
}

export async function generateModifications(
	request: ModificationRequest,
	doc: Document,
): Promise<AppliedModificationsImpl> {
	const appliedModifications = new AppliedModificationsImpl(request);

	try {
		for (const mod of request.modifications) {
			let elements: Array<Element>;
			try {
				if (mod.selector) {
					elements = Array.from(doc.querySelectorAll(mod.selector));
				} else if (mod.xpath) {
					// construct a new NodeListOf<Element> from items found by the xpath
					elements = [];
					if (!mod.xpath.startsWith("//html")) {
						mod.xpath = `//html/${mod.xpath}`;
					}
					const xpath = document.evaluate(
						mod.xpath,
						doc,
						null,
						XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
						null,
					);
					for (let i = 0; i < xpath.snapshotLength; i++) {
						const item = xpath.snapshotItem(i);
						if (item !== null && item instanceof Element) {
							elements.push(item);
						}
					}
				} else {
					console.warn("No selector provided for modification.");
					continue;
				}
			} catch (e) {
				console.warn(
					`Invalid selector: ${mod.selector ? mod.selector : mod.xpath}`,
				);
				continue;
			}

			if (elements.length === 0) {
				console.warn(
					`Element not found for selector: ${
						mod.selector ? mod.selector : mod.xpath
					}`,
				);
				continue;
			}

			for (const element of elements) {
				const appliedModification = await applyModification(element, mod, doc);
				appliedModifications.modifications.push(appliedModification);
			}

			// Add a small delay between modifications
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		// biome-ignore lint/suspicious/noExplicitAny: exception handling
	} catch (error: any) {
		console.error("Error generating modifications:", error);
		throw new Error(`Error generating modifications: ${error}`);
	}

	return appliedModifications;
}

class ReplaceModification extends AppliableModification {
	elementSelector: string;
	oldValue: string;
	newValue: string;

	constructor(doc: Document, element: Element, newValue: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.newValue = newValue;
		this.oldValue = element.innerHTML;
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element) {
			element.innerHTML = this.newValue;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element) {
			element.innerHTML = this.oldValue;
		}
	}
}

class ReplaceAllModification extends AppliableModification {
	element: Element;
	content: string;
	changes: TreeChange[] = [];

	constructor(doc: Document, element: Element, content: string) {
		super(doc);
		this.element = element;
		this.content = content;
	}

	apply(): void {
		this.changes = walkTree(
			this.element,
			checkText(this.content),
			replaceText(this.content),
		);
	}

	unapply(): void {
		const reverseChanges = [...this.changes].reverse();
		for (const change of reverseChanges) {
			const parentElement = this.doc.querySelector(change.parentSelector);
			if (!parentElement) {
				continue;
			}

			const nextSibling =
				parentElement.childNodes[change.replaceStart + change.replaceCount] ||
				null;
			for (let i = change.replaceCount; i > 0; i--) {
				const removeNode =
					parentElement.childNodes[change.replaceStart + i - 1];
				if (removeNode) {
					removeNode.remove();
				}
			}

			const newTextNode = this.doc.createTextNode(change.origText);
			parentElement.insertBefore(newTextNode, nextSibling);
		}
	}
}

class AdjacentHTMLModification extends AppliableModification {
	element: Element;
	position: InsertPosition;
	oldValue: string;
	newValue: string;

	constructor(
		doc: Document,
		element: Element,
		position: InsertPosition,
		newValue: string,
	) {
		super(doc);
		this.element = element;
		this.position = position;
		this.newValue = newValue;
		this.oldValue = element.outerHTML;
	}

	apply(): void {
		this.element.insertAdjacentHTML(this.position, this.newValue);
	}

	unapply(): void {
		this.element.outerHTML = this.oldValue;
	}
}

class RemoveModification extends AppliableModification {
	element: Element;
	parentSelector: string | null;
	nextSiblingSelector: string | null = null;

	constructor(doc: Document, element: Element) {
		super(doc);
		this.element = element;
		this.parentSelector = element.parentElement
			? cssSelector.getCssSelector(element.parentElement)
			: null;
	}

	apply(): void {
		// get the element's next sibling
		const nextSibling = this.element.nextElementSibling;
		this.element.remove();
		// now get the selector for the sibling after the element was
		// removed
		this.nextSiblingSelector = nextSibling
			? cssSelector.getCssSelector(nextSibling)
			: null;
	}

	unapply(): void {
		let parent: Element | null = null;
		if (this.parentSelector) {
			parent = this.doc.querySelector(this.parentSelector);
		}
		if (!parent) {
			return;
		}

		let nextSibling: Element | null = null;
		if (this.nextSiblingSelector) {
			nextSibling = this.doc.querySelector(this.nextSiblingSelector);
		}

		if (nextSibling) {
			parent.insertBefore(this.element, nextSibling);
		} else {
			parent.appendChild(this.element);
		}
	}
}

class SwapImageModification extends AppliableModification {
	elementSelector: string;
	imageUrl: string;
	previousUrl: string | null;

	constructor(doc: Document, element: Element, imageUrl: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.imageUrl = imageUrl;

		if (element instanceof HTMLImageElement) {
			this.previousUrl = element.getAttribute("src");
		} else {
			this.previousUrl = null;
		}
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLImageElement) {
			element.src = this.imageUrl;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (this.previousUrl && element && element instanceof HTMLImageElement) {
			element.setAttribute("src", this.previousUrl);
		}
	}
}

class ToastModification extends AppliableModification {
	message: string;
	duration: number;

	constructor(doc: Document, message: string, duration: number) {
		super(doc);
		this.message = message;
		this.duration = duration;
	}

	apply(): void {
		createToast(this.message, this.doc, this.duration);
	}

	unapply(): void {
		// can't undo
	}
}

class HighlightModification extends AppliableModification {
	elementSelector: string;
	highlightStyle: string;
	prevBorder: string;

	constructor(doc: Document, element: Element, highlightStyle: string) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.highlightStyle = highlightStyle;
		this.prevBorder = "";

		if (element instanceof HTMLElement) {
			this.prevBorder = element.style.border;
		}
	}

	apply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLElement) {
			element.style.border = this.highlightStyle;
		}
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (element && element instanceof HTMLElement) {
			element.style.border = this.prevBorder;
		}
	}
}

class TimestampModification extends AppliableModification {
	elementSelector: string;
	timestampRef: TimeStampReference | undefined;
	originalText: string | undefined;
	originalLabel: string | undefined;

	constructor(
		doc: Document,
		element: Element,
		timestampRef: TimeStampReference | undefined,
	) {
		super(doc);
		this.elementSelector = cssSelector.getCssSelector(element);
		this.timestampRef = timestampRef;
	}

	apply(): void {
		if (!this.timestampRef) {
			console.warn("No timestamp reference provided for modification.");
			return;
		}

		const element = this.doc.querySelector(this.elementSelector);
		if (!element) {
			return;
		}

		const { originalText, originalLabel } = modifyTimestamp(
			element,
			this.timestampRef,
		);
		this.originalText = originalText;
		this.originalLabel = originalLabel;
	}

	unapply(): void {
		const element = this.doc.querySelector(this.elementSelector);
		if (!element) {
			return;
		}

		if (this.originalText) {
			element.textContent = this.originalText;
		}
		if (this.originalLabel) {
			element.setAttribute("aria-label", this.originalLabel);
		}
	}
}

class NoopModification extends AppliableModification {
	action: string;

	constructor(doc: Document, action: string) {
		super(doc);
		this.action = action;
	}

	apply(): void {
		console.warn(`Unknown action: ${this.action}`);
	}

	unapply(): void {}
}

export async function applyModification(
	element: Element,
	mod: Modification,
	doc: Document,
): Promise<AppliableModification> {
	let modification: AppliableModification;

	switch (mod.action) {
		case "replace":
			modification = new ReplaceModification(doc, element, mod.content || "");
			break;
		case "replaceAll":
			modification = new ReplaceAllModification(
				doc,
				element,
				mod.content || "",
			);
			break;
		case "append":
			modification = new AdjacentHTMLModification(
				doc,
				element,
				"beforeend",
				mod.content || "",
			);
			break;
		case "prepend":
			modification = new AdjacentHTMLModification(
				doc,
				element,
				"afterbegin",
				mod.content || "",
			);
			break;
		case "remove":
			modification = new RemoveModification(doc, element);
			break;
		case "swapImage":
			modification = new SwapImageModification(
				doc,
				element,
				mod.imageUrl || "",
			);
			break;
		case "highlight":
			modification = new HighlightModification(
				doc,
				element,
				mod.highlightStyle || "2px solid red",
			);
			break;
		case "toast":
			modification = new ToastModification(
				doc,
				mod.toastMessage || "Notification",
				mod.duration || 3000,
			);
			break;
		case "addComponent":
			modification = new AdjacentHTMLModification(
				doc,
				element,
				"beforeend",
				mod.componentHtml || "",
			);
			break;
		case "updateTimestampReferences":
			modification = new TimestampModification(doc, element, mod.timestampRef);
			break;
		default:
			modification = new NoopModification(doc, mod.action);
			break;
	}

	modification.apply();
	return modification;
}

export function createToast(
	message: string,
	doc: Document,
	duration = 3000,
): void {
	const toast = doc.createElement("div");
	toast.className = "fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded";
	toast.textContent = message;
	doc.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, duration);
}

export function modifyTimestamp(
	element: Element,
	timestampRef: TimeStampReference,
): { originalText: string; originalLabel: string } {
	const originalText = element.textContent || "";
	const originalLabel = element.getAttribute("aria-label") || "";
	const [originalMonth, originalDay] = originalText.split(" ");

	if (!originalMonth || !originalDay) {
		console.warn(`Invalid date format: ${originalText}`);
		return { originalText, originalLabel };
	}

	// Calculate the new day and month based on the timestampRef
	const { newDay, newMonth } = calculateNewDate(
		originalDay,
		originalMonth,
		timestampRef.recordedAt,
		timestampRef.currentTime,
	);

	// Update the element's textContent and aria-label with the new day and month
	element.textContent = `${newMonth} ${newDay}`;
	// Note the space before the month to avoid concatenation with the day
	const newLabel = originalLabel.replace(/ .+,/, ` ${newMonth} ${newDay},`);
	element.setAttribute("aria-label", newLabel);

	return { originalText, originalLabel };
}

function calculateNewDate(
	originalDay: string,
	originalMonth: string,
	recordedAt: string,
	currentTime: string,
): { newDay: string; newMonth: string } {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const recordedDate = new Date(recordedAt);
	const currentDate = new Date(currentTime);
	const differenceInDays = Math.ceil(
		Math.abs(
			(currentDate.getTime() - recordedDate.getTime()) / (1000 * 3600 * 24),
		),
	);

	const originalDate = new Date(recordedDate);
	originalDate.setDate(Number.parseInt(originalDay, 10));

	const newDate = new Date(originalDate);
	newDate.setDate(originalDate.getDate() + differenceInDays);

	const newDay = String(newDate.getDate()).padStart(2, "0");
	const newMonth = months[newDate.getMonth()] || originalMonth;

	return { newDay, newMonth };
}

type TreeChange = {
	parentSelector: string;
	origText: string;
	replaceStart: number;
	replaceCount: number;
};

function walkTree(
	rootElement: Node,
	checker: (textNode: Node) => boolean,
	changer: (textNode: Node) => TreeChange | null,
): TreeChange[] {
	const changeNodes: Node[] = [];
	const changes: TreeChange[] = [];

	const treeWalker = document.createTreeWalker(
		rootElement,
		NodeFilter.SHOW_TEXT,
		(node) => {
			if (
				node.parentElement instanceof HTMLScriptElement ||
				node.parentElement instanceof HTMLStyleElement
			) {
				return NodeFilter.FILTER_REJECT;
			}
			return NodeFilter.FILTER_ACCEPT;
		},
	);
	let textNode: Node;
	do {
		textNode = treeWalker.currentNode;
		if (textNode.nodeValue === null || !textNode?.nodeValue?.trim()) {
			continue;
		}

		if (checker(textNode)) {
			changeNodes.push(textNode);
		}
	} while (treeWalker.nextNode());

	for (const node of changeNodes) {
		const change = changer(node);
		if (change) {
			changes.push(change);
		}
	}

	return changes;
}

function checkText(pattern: string): (node: Node) => boolean {
	const { patternRegexp } = toRegExpPattern(pattern);

	return (node: Node) => {
		if (!node.textContent || !node.nodeValue) {
			return false;
		}

		patternRegexp.lastIndex = 0;
		return patternRegexp.test(node.nodeValue || "");
	};
}

function replaceText(pattern: string): (node: Node) => TreeChange | null {
	const { patternRegexp, replacement } = toRegExpPattern(pattern);

	return (node: Node) => {
		let split = node.nodeValue?.split(patternRegexp) || [];
		split = split.map((part, index) => {
			if (index % 2 === 0) {
				return part;
			}
			return replaceFirstLetterCaseAndPlural(replacement)(part);
		});

		const parentElement = node.parentElement;
		if (!parentElement) {
			return null;
		}
		const parentSelector = cssSelector.getCssSelector(parentElement);

		let replaceStart = 0;
		const nextSibling = node.nextSibling;
		if (nextSibling) {
			for (let i = 0; i < parentElement.childNodes.length; i++) {
				if (parentElement.childNodes[i] === nextSibling) {
					replaceStart = i - 1;
					break;
				}
			}
		}

		parentElement.removeChild(node);

		for (let i = 0; i < split.length; i++) {
			if (typeof split[i] !== "undefined") {
				const textNode = document.createTextNode(split[i] || "");
				parentElement.insertBefore(textNode, nextSibling);
			}
		}

		return {
			parentSelector: parentSelector,
			origText: node.nodeValue || "",
			replaceStart: replaceStart,
			replaceCount: split.length,
		};
	};
}

function replaceFirstLetterCaseAndPlural(value: string) {
	return (match: string) => {
		let out = value;

		// change the case if the first letter of the match is uppercase
		if (match[0]?.toLowerCase() !== match[0]?.toUpperCase()) {
			if (match[0] === match[0]?.toUpperCase()) {
				out = out.charAt(0).toUpperCase() + out.slice(1);
			}
		}

		// if the match is plural, add an s
		if (match.endsWith("s")) {
			out = `${out}s`;
		}

		return out;
	};
}

// Take pattern in the form of /pattern/replacement/ and return {patternRegexp, replacement}
function toRegExpPattern(pattern: string): {
	patternRegexp: RegExp;
	replacement: string;
} {
	const match = /\/(.+)\/(.+)\//.exec(pattern);
	if (!match || match.length !== 3 || !match[1] || !match[2]) {
		throw new Error(`Invalid pattern: ${pattern}`);
	}

	return {
		patternRegexp: new RegExp(`(\\b${match[1]}s?\\b)`, "gi"),
		replacement: match[2],
	};
}
