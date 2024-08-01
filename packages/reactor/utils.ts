// utils.ts

import { throws } from "assert";
import type { Modification, ModificationRequest, AppliedModifications } from "./interfaces";

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
		for (const mod of this.modifications) {
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
	element: Element;
	oldValue: string;
	newValue: string;

	constructor(element: Element, newValue: string) {
		super();
		this.element = element;
		this.newValue = newValue;
		this.oldValue = element.innerHTML;
	}

	apply(): void {
		this.element.innerHTML = this.newValue;
	}

	unapply(): void {
		this.element.innerHTML = this.oldValue;
	}
}

class AdjacentHTMLModification extends AppliableModification {
	element: Element;
	position: InsertPosition;
	oldValue: string;
	newValue: string;

	constructor(element: Element, position: InsertPosition, newValue: string) {
		super();
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
	parent: Element | null;
	nextSibling: Element | null;

	constructor(element: Element) {
		super();
		this.element = element;
		this.parent = element.parentElement;
		this.nextSibling = element.nextElementSibling;
	}

	apply(): void {
		this.element.remove();
	}

	unapply(): void {
		this.parent?.insertBefore(this.element, this.nextSibling);
	}
}

class SwapImageModification extends AppliableModification {
	element: Element;
	imageUrl: string;
	previousUrl: string | null;

	constructor(element: Element, imageUrl: string) {
		super();
		this.element = element;
		this.imageUrl = imageUrl;

		if (this.element instanceof HTMLImageElement) {
			this.previousUrl = this.element.getAttribute("src");
		} else {
			this.previousUrl = null;
		}
	}

	apply(): void {
		if (this.element instanceof HTMLImageElement) {
			this.element.src = this.imageUrl;
		}
	}

	unapply(): void {
		if (this.element instanceof HTMLImageElement && this.previousUrl) {
			this.element.setAttribute("src", this.previousUrl);
		}
	}
}

class ToastModification extends AppliableModification {
	message: string;
	doc: Document;
	duration: number;

	constructor(message: string, doc: Document, duration: number) {
		super();
		this.message = message;
		this.doc = doc;
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
	element: Element;
	highlightStyle: string;
	prevBorder: string;

	constructor(element: Element, highlightStyle: string) {
		super();
		this.element = element;
		this.highlightStyle = highlightStyle;
		this.prevBorder = "";

		if (this.element instanceof HTMLElement) {
			this.prevBorder = this.element.style.border;
		}
	}

	apply(): void {
		if (this.element instanceof HTMLElement) {
			this.element.style.border = this.highlightStyle;
		}
	}

	unapply(): void {
		if (this.element instanceof HTMLElement) {
			this.element.style.border = this.prevBorder;
		}
	}
}

class NoopModification extends AppliableModification {
	action: string;

	constructor(action: string) {
		super();	
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
			modification = new ReplaceModification(element, mod.content || "");
			break;
		// case "replaceAll":
		// 	walkTree(element, replaceText(mod.content || ""));
		// 	break;
		case "append":
			modification = new AdjacentHTMLModification(
				element, "beforeend", mod.content || ""
			);
			break;
		case "prepend":
			modification = new AdjacentHTMLModification(
				element, "afterbegin", mod.content || ""
			);
			break;
		case "remove":
			modification = new RemoveModification(element);
			break;
		case "swapImage":
			modification = new SwapImageModification(element, mod.imageUrl || "");
			break;
		case "highlight":
			modification = new HighlightModification(element, mod.highlightStyle || "2px solid red");
			break;
		case "toast":
			modification = new ToastModification(mod.toastMessage || "Notification", doc, mod.duration || 3000);
			break;
		case "addComponent":
			modification = new AdjacentHTMLModification(
				element, "beforeend", mod.componentHtml || ""
			)
		 	break;
		default:
			modification = new NoopModification(mod.action);
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

function walkTree(rootElement: Node, iterator: (textNode: Node) => void) {
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
		if (textNode.nodeValue === null || !textNode?.textContent?.trim()) {
			continue;
		}

		iterator(textNode);
	} while (treeWalker.nextNode());
}

function replaceText(pattern: string): (node: Node) => void {
	const { patternRegexp, replacement } = toRegExpPattern(pattern);

	return (node: Node) => {
		if (!node.textContent || !node.nodeValue) {
			return;
		}

		if (patternRegexp.test(node.textContent)) {
			node.nodeValue = node.nodeValue.replace(
				patternRegexp,
				replaceFirstLetterCaseAndPlural(replacement),
			);
		}
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
			out = out + "s";
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
		patternRegexp: new RegExp('\\b' + match[1] + 's?\\b', "gi"),
		replacement: match[2],
	};
}
