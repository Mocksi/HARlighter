import { AppliableModification } from "../interfaces.js";

export class ReplaceAllModification extends AppliableModification {
	element: Element;
	content: string;
	changes: TreeChange[] = [];
	observer: MutationObserver;

	constructor(doc: Document, element: Element, content: string) {
		super(doc);
		this.element = element;
		this.content = content;
		
		this.observer = new MutationObserver(this.handleMutation.bind(this));
	}

	apply(): void {
		// mark the element as modified
		this.addModifiedElement(this.element);

		this.changes = walkTree(
			this.element,
			checkText(this.content),
			replaceText(this.content, 
				this.addModifiedElement.bind(this),
				this.addHighlightNode.bind(this)),
		);

		this.observer.observe(this.element, { childList: true, subtree: true });
	}

	unapply(): void {
		this.observer.disconnect();

		const reverseChanges = [...this.changes].reverse();
		for (const change of reverseChanges) {
			const parentElement = this.getModifiedElement(change.parentMocksiId);
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

	handleMutation(mutations: MutationRecord[]) {
		this.observer.disconnect();

		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				for (const added of mutation.addedNodes) {
					const changes = walkTree(
						added,
						checkText(this.content),
						replaceText(this.content, 
							this.addModifiedElement.bind(this),
							this.addHighlightNode.bind(this)),
					);
					
					console.debug(`Added: ${added.nodeName} changes: ${changes.length}`);
					
					this.changes = this.changes.concat(changes);
				}
			}
		}
		
		this.observer.observe(this.element, { childList: true, subtree: true });
	}

	modifiedElementRemoved(element: Element, mocksiId: string): boolean {
		const noState = super.modifiedElementRemoved(element, mocksiId);

		// remove any changes that were made to this element
		this.changes = this.changes.filter((c) => c.parentMocksiId !== mocksiId);
		
		// if all changed nodes have been removed (including the element itself),
		// it is safe to remove this modification
		return noState && this.changes.length === 0;
	}
}

type TreeChange = {
	parentMocksiId: string;
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

	const treeWalker = window.document.createTreeWalker(
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

function replaceText(
	pattern: string,
	addModifiedElement: (element: Element) => string,
	addHighlightNode: (node: Node) => void,
): (node: Node) => TreeChange | null {
	const { patternRegexp, replacement, flags } = toRegExpPattern(pattern);

	return (node: Node) => {
		let split = node.nodeValue?.split(patternRegexp) || [];
		split = split.map((part, index) => {
			if (index % 2 === 0) {
				return part;
			}
			return replaceFirstLetterCaseAndPlural(replacement, flags)(part);
		});

		const parentElement = node.parentElement;
		if (!parentElement) {
			return null;
		}
		const parentMocksiId = addModifiedElement(parentElement);

		let replaceStart = 0;
		const nextSibling = node.nextSibling;
		const prevSibling = node.previousSibling;
		if (prevSibling || nextSibling) {
			for (let i = 0; i < parentElement.childNodes.length; i++) {
				if (parentElement.childNodes[i] === prevSibling) {
					replaceStart = i + 1;
					break;
				} else if (parentElement.childNodes[i] === nextSibling) {
					replaceStart = i - 1;
					break;
				}
			}
		}

		parentElement.removeChild(node);

		for (let i = 0; i < split.length; i++) {
			if (typeof split[i] !== "undefined") {
				const textNode = window.document.createTextNode(split[i] || "");
				parentElement.insertBefore(textNode, nextSibling);

				if (i % 2 !== 0) {
					addHighlightNode(textNode);
				}
			}
		}

		return {
			parentMocksiId: parentMocksiId,
			origText: node.nodeValue || "",
			replaceStart: replaceStart,
			replaceCount: split.length,
		};
	};
}

function replaceFirstLetterCaseAndPlural(value: string, flags: Partial<Record<PatternFlag, boolean>> = {}) {
	return (match: string) => {
		let out = value;

		// change the case if the first letter of the match is uppercase
		if (match[0]?.toLowerCase() !== match[0]?.toUpperCase()) {
			if (match[0] === match[0]?.toUpperCase()) {
				out = out.charAt(0).toUpperCase() + out.slice(1);
			}
		}

		// if the match is plural, add an s
		if ((flags[PatternFlag.Plurals] ?? false) && match.endsWith("s")) {
			out = `${out}s`;
		}

		return out;
	};
}

enum PatternFlag {
	CaseInsensitive = "i",
	WordBoundary = "w",
	Plurals = "p",
}

// Take pattern in the form of /pattern/replacement/ and return {patternRegexp, replacement}
function toRegExpPattern(pattern: string): {
	patternRegexp: RegExp;
	replacement: string;
	flags: Partial<Record<PatternFlag, boolean>>;
} {
	const match = /\/(.+)\/(.+)\/(.*)/.exec(pattern);
	if (!match || match.length < 3 || !match[1] || !match[2]) {
		throw new Error(`Invalid pattern: ${pattern}`);
	}

	let reFlags = "g";
	let rePattern = match[1];
	const flags = match[3];

	const patternFlags: Partial<Record<PatternFlag, boolean>> = {};

	if (flags?.includes('p')) {
		rePattern += "s?";
		patternFlags[PatternFlag.Plurals] = true;
	}

	if (flags?.includes('w')) {
		rePattern = `\\b${rePattern}\\b`;
		patternFlags[PatternFlag.WordBoundary] = true;
	}

	if (flags?.includes('i')) {
		reFlags += "i";
		patternFlags[PatternFlag.CaseInsensitive] = true;
	}

	return {
		patternRegexp: new RegExp(`(${rePattern})`, reFlags),
		replacement: match[2],
		flags: patternFlags,
	};
}
