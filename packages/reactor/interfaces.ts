import { EventEmitter } from 'events';

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
}

export interface DomJsonExportNode {
	tag: string;
	visible: boolean;
	text?: string;
	attributes?: Record<string, string>;
	children?: DomJsonExportNode[];
}

interface ReactorEvents {
	/**
	 * Called when a url is loaded by the browser. Can be used to modify the list
	 * of applied modifications.
	 * @param url the url that was loaded
	 */
	onUrlLoaded: (url: string) => void;

	/**
	 * Called when a new page in an SPA is loaded by the browser. Can be used to
	 * modify the list of applied modifications.
	 * @param url the url that was loaded
	 * @param page the page that was loaded
	 */
	onPageLoaded: (url: string, page: string) => void;
}

/**
 * Reactor applied modifications to the current page. Modifications
 * are applied in the order they were added. Removing a modification
 * unapplies it.
 */
interface Reactor extends EventEmitter {
	/**
	 * Attach Reactor to the current tab. Reactor will start generating
	 * events and apply any modifications.
	 */
	attach(): void;

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

	/**
	 * Event listeners
	 */
	on: <K extends keyof ReactorEvents>(event: K, listener: ReactorEvents[K]) => this;
  	
	/**
	 * Event emitters
	 */
	emit: <K extends keyof ReactorEvents>(event: K, ...args: Parameters<ReactorEvents[K]>) => boolean;
}
