import type { Modification, ModificationRequest } from "./interfaces";

export function parseRequest(userRequest: string): ModificationRequest {
	try {
		return JSON.parse(userRequest);
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		console.error("Error parsing user request:", error);
		throw new Error("Invalid user request format");
	}
}

function calculateNewDate(
	originalDay: string,
	originalMonth: string,
	recordedAt: string,
	currentTime: string,
): { newDay: string, newMonth: string } {
	const months = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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

export async function generateModifications(
	request: ModificationRequest,
	doc: Document,
): Promise<void> {
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
				await applyModification(element, mod, doc);
			}

			// Add a small delay between modifications
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		// biome-ignore lint/suspicious/noExplicitAny: exception handling
	} catch (error: any) {
		console.error("Error generating modifications:", error);
		throw new Error(`Error generating modifications: ${error}`);
	}
}

export async function applyModification(
	element: Element,
	mod: Modification,
	doc: Document,
): Promise<void> {
	switch (mod.action) {
		case "replace":
			element.innerHTML = mod.content || "";
			break;
		case "replaceAll":
			walkTree(element, replaceText(mod.content || ""));
			break;
		case "append":
			element.insertAdjacentHTML("beforeend", mod.content || "");
			break;
		case "prepend":
			element.insertAdjacentHTML("afterbegin", mod.content || "");
			break;
		case "remove":
			element.remove();
			break;
		case "swapImage":
			if (element instanceof HTMLImageElement) {
				element.src = mod.imageUrl || "";
			}
			break;
		case "highlight":
			if (element instanceof HTMLElement) {
				element.style.border = mod.highlightStyle || "2px solid red";
			}
			break;
		case "toast":
			createToast(mod.toastMessage || "Notification", doc, mod.duration);
			break;
		case "addComponent":
			element.insertAdjacentHTML("beforeend", mod.componentHtml || "");
			break;
		case "updateTimestampReferences": {
			if (!mod.timestampRef) {
				console.warn("No timestamp reference provided for modification.");
				return;
			}
			let targetElement = element;
			if (mod.selector) {
				targetElement = element.querySelector(mod.selector) || element;
			}
			if (!targetElement) {
				console.warn(
					`Element not found for selector: ${mod.selector || "self"}`,
				);
				return;
			}
			const originalText = targetElement.textContent || "";
			const originalLabel = targetElement.getAttribute("aria-label") || "";
			const [originalMonth, originalDay] = originalText.split(" ");

			if (!originalMonth || !originalDay) {
				console.warn(`Invalid date format: ${originalText}`);
				return;
			}

			// Calculate the new day and month based on the timestampRef
			const { newDay, newMonth } = calculateNewDate(
				originalDay,
				originalMonth,
				mod.timestampRef.recordedAt,
				mod.timestampRef.currentTime,
			);

			// Update the element's textContent and aria-label with the new day and month
			targetElement.textContent = `${newMonth} ${newDay}`;
			// Note the space before the month to avoid concatenation with the day
			const newLabel = originalLabel.replace(/ .+,/, ` ${newMonth} ${newDay},`);
			targetElement.setAttribute("aria-label", newLabel);

			break;
		}
		default:
			console.warn(`Unknown action: ${mod.action}`);
	}
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
				replaceFirstLetterCase(replacement),
			);
		}
	};
}

function replaceFirstLetterCase(value: string) {
	return (match: string) => {
		if (match[0]?.toLowerCase() !== match[0]?.toUpperCase()) {
			// Check if the first character is alphabetical
			if (match[0] === match[0]?.toUpperCase()) {
				return value.charAt(0).toUpperCase() + value.slice(1);
			}
		}
		return value;
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
		patternRegexp: new RegExp(match[1], "gi"),
		replacement: match[2],
	};
}
