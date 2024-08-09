import { AppliableModification, type TimeStampReference } from "../interfaces";
const cssSelector = require("css-selector-generator");

export class TimestampModification extends AppliableModification {
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

		this.addHighlightNode(element);
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
