import { AdjacentHTMLModification } from "./modifications/adjacentHTML.js";
import { HighlightModification } from "./modifications/highlight.js";
import { NoopModification } from "./modifications/noop.js";
import { RemoveModification } from "./modifications/remove.js";
import { ReplaceModification } from "./modifications/replace.js";
import { ReplaceAllModification } from "./modifications/replaceAll.js";
import { SwapImageModification } from "./modifications/swapImage.js";
import { ToastModification } from "./modifications/toast.js";

import type {
	AppliableModification,
	AppliedModifications,
	Highlighter,
	Modification,
	ModificationRequest,
} from "./interfaces.js";

export class AppliedModificationsImpl implements AppliedModifications {
	modificationRequest: ModificationRequest;
	modifications: Array<AppliableModification> = [];
	highlighter?: Highlighter;

	constructor(
		modificationRequest: ModificationRequest,
		highlighter?: Highlighter,
	) {
		this.modificationRequest = modificationRequest;
		this.highlighter = highlighter;
	}

	unapply(): void {
		const reversedModifications = [...this.modifications].reverse();
		for (const mod of reversedModifications) {
			mod.unapply();
		}
	}

	setHighlight(highlight: boolean): void {
		if (this.highlighter) {
			for (const mod of this.modifications) {
				for (const node of mod.highlightNodes) {
					if (highlight) {
						this.highlighter.highlightNode(node);
					} else {
						this.highlighter.removeHighlightNode(node);
					}
				}
			}
		}
	}
}

export async function generateModifications(
	request: ModificationRequest,
	doc: Document,
	highlighter?: Highlighter,
): Promise<AppliedModificationsImpl> {
	const appliedModifications = new AppliedModificationsImpl(
		request,
		highlighter,
	);

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
						mod.xpath = `//html${mod.xpath}`;
					}
					const xpath = window.document.evaluate(
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
		default:
			modification = new NoopModification(doc, mod.action);
			break;
	}

	modification.apply();
	return modification;
}

export function matchesSelector(element: Element, mod: Modification): boolean {
	if (mod.selector) {
		return element.matches(mod.selector);
	} else if (mod.xpath) {
		const xpathResult = window.document.evaluate(mod.xpath, window.document, null, XPathResult.BOOLEAN_TYPE, null);
		return xpathResult.booleanValue;
	}

	return false;
}
