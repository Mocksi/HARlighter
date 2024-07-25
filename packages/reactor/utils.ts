// utils.ts

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

function calculateNewDay(
	originalDay: string,
	recordedAt: string,
	currentTime: string,
): string {
	const recordedDate = new Date(recordedAt);
	const currentDate = new Date(currentTime);
	const differenceInDays = Math.ceil(
		Math.abs(
			(currentDate.getTime() - recordedDate.getTime()) / (1000 * 3600 * 24),
		),
	);
	const newDay = Number.parseInt(originalDay, 10) + differenceInDays;
	return String(newDay).padStart(2, "0"); // Ensure two digits
}

function calculateNewMonth(
	originalMonth: string,
	recordedAt: string,
	currentTime: string,
): string {
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
	const differenceInMonths =
		(currentDate.getFullYear() - recordedDate.getFullYear()) * 12 +
		currentDate.getMonth() -
		recordedDate.getMonth();

	const originalMonthIndex = months.indexOf(originalMonth);
	if (originalMonthIndex === -1) {
		console.warn(`Invalid month: ${originalMonth}`);
		return originalMonth;
	}

	let newMonthIndex = (originalMonthIndex + differenceInMonths) % 12;
	if (newMonthIndex < 0) {
		newMonthIndex += 12;
	}

	return months[newMonthIndex] || originalMonth;
}
export async function generateModifications(
	request: ModificationRequest,
	doc: Document,
): Promise<void> {
	try {
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
			const targetElement = element.querySelector(
				'[data-column-id="issueCreatedAt"] span',
			);
			if (!targetElement) {
				console.warn(
					`Element not found for selector: [data-column-id="issueCreatedAt"] span`,
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
			const newDay = calculateNewDay(
				originalDay,
				mod.timestampRef.recordedAt,
				mod.timestampRef.currentTime,
			);
			const newMonth = calculateNewMonth(
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
