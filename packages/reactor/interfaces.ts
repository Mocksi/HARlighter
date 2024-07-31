export interface Modification {
	selector?: string;
	xpath?: string;
	action:
		| "replace"
		| "replaceAll"
		| "append"
		| "prepend"
		| "remove"
		| "swapImage"
		| "highlight"
		| "toast"
		| "addComponent"
		| "unknown";
	content?: string;
	imageUrl?: string;
	toastMessage?: string;
	componentHtml?: string;
	highlightStyle?: string;
	duration?: number;
}

export interface ModificationRequest {
	description: string;
	modifications: Modification[];
}

export interface AppliedModification {
	modificationRequest: ModificationRequest;

	/**
	 * Turn highlighting on or off for the changes made
	 * by this request
	 */
	setHighlight(highlight: boolean): void;
}

export interface DomJsonExportNode {
	tag: string;
	visible: boolean;
	text?: string;
	attributes?: Record<string, string>;
	children?: DomJsonExportNode[];
}

/**
 * Reactor applied modifications to the current page. Modifications
 * are applied in the order they were added. Removing a modification
 * unapplies it.
 */
export interface Reactor {
	/**
	 * Attach Reactor to the current tab. Reactor will start generating
	 * events and apply any modifications.
	 */
	attach(root: Document): void;

	/**
	 * Detach Reactor from the current tab. Reactor will remove any applied
	 * modifications and stop generating events.
	 */
	detach(): void;

	/**
	 * Get the list of currently applied modifications. This
	 * list is backed by the appliedModifications themselves, so
	 * make a change to the list will also apply/unapply any
	 * modifications as needed.
	 * 
	 * @returns The list of applied modifications
	 */
	getAppliedModifications(): AppliedModification[];

	/** 
	 * Shortcut to add a modification. This is the equivalent of calling
	 * getAppliedModifications().push(modificationRequest)
	 */
	addModification(modificationRequest: ModificationRequest): void;
	
	/**
	 * Shortcut to remove the most recently added modification. This
	 * is the equivalent of calling getAppliedModifications().pop()
	 */
	removeLastModification(): void;
}
