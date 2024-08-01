interface TimeStampReference {
	// NOTE: this is a iso8601 date string
	recordedAt: string;
	// NOTE: this is a iso8601 date string
	currentTime: string;
}

export interface Modification {
	selector?: string;
	action:
		| "replace"
		| "append"
		| "prepend"
		| "remove"
		| "swapImage"
		| "highlight"
		| "toast"
		| "addComponent"
		| "updateTimestampReferences"
		| "unknown";
	content?: string;
	imageUrl?: string;
	toastMessage?: string;
	componentHtml?: string;
	highlightStyle?: string;
	duration?: number;
	timestampRef?: TimeStampReference;
}

export interface ModificationRequest {
	description: string;
	modifications: Modification[];
}
