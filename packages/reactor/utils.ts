// utils.ts

import type { Modification, ModificationRequest } from "./interfaces";

export function parseRequest(userRequest: string): ModificationRequest {
	return JSON.parse(userRequest);
}

export async function generateModifications(
	request: ModificationRequest,
	doc: Document,
): Promise<void> {
	for (const mod of request.modifications) {
		let elements: NodeListOf<Element>;
		try {
			if (!mod.selector) {
				console.warn("No selector provided for modification.");
				continue;
			}
			elements = doc.querySelectorAll(mod.selector);
		} catch (e) {
			console.warn(`Invalid selector: ${mod.selector}`);
			continue;
		}

		if (elements.length === 0) {
			console.warn(`Element not found for selector: ${mod.selector}`);
			continue;
		}

		for (const element of elements) {
			await applyModification(element, mod, doc);
		}

		// Add a small delay between modifications
		await new Promise((resolve) => setTimeout(resolve, 100));
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
			createToast(mod.toastMessage || "Notification", doc);
			break;
		case "addComponent":
			element.insertAdjacentHTML("beforeend", mod.componentHtml || "");
			break;
		default:
			console.warn(`Unknown action: ${mod.action}`);
	}
}

export function createToast(message: string, doc: Document): void {
	const toast = doc.createElement("div");
	toast.className = "fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded";
	toast.textContent = message;
	doc.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 3000);
}
