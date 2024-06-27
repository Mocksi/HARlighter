type FragmentTextNode = (
	fragmentsToHighlight: Node[],
	matches: RegExpMatchArray[],
	textNode: Node,
	newText: string,
) => DocumentFragment | null;

interface ContentHighlighterInterface {
	highlightNode(node: Node): void;
	removeHighlightNode(node: Node): void;
}

type SaveModification = (
	element: HTMLElement,
	newText: string,
	cleanPattern: string,
	type: "text" | "image",
) => void;

export class DOMManipulator {
	private observer: MutationObserver | undefined;
	private patterns: { pattern: RegExp; replace: string }[] = [];

	constructor(
		private fragmentTextNode: FragmentTextNode,
		private contentHighlighter: ContentHighlighterInterface,
		private saveModification: SaveModification,
	) {}

	getPatternCount() {
		return this.patterns.length;
	}

	addPattern(pattern: string | RegExp, replace: string) {
		const replacePattern = { pattern: toRegExpPattern(pattern), replace };
		this.patterns.push(replacePattern);
		this.seekAndReplaceAllPage(replacePattern.pattern, replacePattern.replace);
	}

	removePattern(pattern: string | RegExp) {
		const pattern_ = toRegExpPattern(pattern);
		const idx = this.patterns.findIndex(
			(p) => p.pattern.source === pattern_.source,
		);
		if (idx >= 0) {
			this.patterns.splice(idx, 1);
		}

		if (this.patterns.length === 0) {
			this.observer?.disconnect();
			this.observer = undefined;
		}
	}

	seekAndReplaceAllPage(pattern: RegExp, newText: string) {
		const body = document.querySelector("body");
		if (!body) {
			console.log("Body not found");
			return;
		}
		this.iterateAndReplace(body, pattern, newText, true);
	}

	iterateAndReplace(
		rootNode: Node,
		oldValueInPattern: RegExp,
		newText: string,
		highlightReplacements: boolean,
		appliedReplacements: HTMLElement[] = [],
	) {
		const fragmentsToHighlight: Node[] = [];
		const replacementsToApply: { nodeToReplace: Node; replacement: Node }[] =
			[];
		createTreeWalker(
			rootNode,
			(textNode) => {
				fillReplacements(
					textNode,
					oldValueInPattern,
					newText,
					fragmentsToHighlight,
					replacementsToApply,
					this.fragmentTextNode,
					this.saveModification,
				);
			},
			appliedReplacements,
		);
		for (const { nodeToReplace, replacement } of replacementsToApply) {
			if (nodeToReplace.parentElement == null) {
				continue;
			}
			this.contentHighlighter.removeHighlightNode(nodeToReplace);
			nodeToReplace.parentElement.replaceChild(replacement, nodeToReplace);
		}

		if (highlightReplacements) {
			for (const fragment of fragmentsToHighlight) {
				this.contentHighlighter.highlightNode(fragment);
			}
		}
	}

	createObserver() {
		this.observer = new MutationObserver(this.handleMutations.bind(this));
		this.observer.observe(document, { childList: true, subtree: true });
	}

	handleMutations(mutations: MutationRecord[]) {
		for (const mutation of mutations) {
			this.handleMutation(mutation);
		}
	}

	handleMutation(mutation: MutationRecord) {
		if (mutation.addedNodes == null || mutation.addedNodes.length === 0) {
			return;
		}
		for (const node of mutation.addedNodes) {
			this.handleAddedNode(node);
		}
	}

	handleAddedNode(node: Node) {
		createTreeWalker(node, (textNode) => {
			if (!textNode.textContent || !textNode.nodeValue) {
				return;
			}

			const replace = this.matchReplacePattern(textNode.textContent);
			if (replace) {
				textNode.nodeValue = textNode.nodeValue.replace(
					replace.pattern,
					replaceFirstLetterCase(replace.replace),
				);
			}
		});
	}

	matchReplacePattern(
		text: string,
	): { pattern: RegExp; replace: string } | null {
		for (const pattern of this.patterns) {
			if (pattern.pattern.test(text)) {
				return { pattern: pattern.pattern, replace: pattern.replace };
			}
		}

		return null;
	}

	replaceImage(oldSrc: string, newSrc: string) {
		const images = document.querySelectorAll(
			"img",
		) as NodeListOf<HTMLImageElement>;
		for (const img of images) {
			if (img.src !== oldSrc) {
				continue;
			}
			img.src = newSrc;
			if (img.srcset) {
				img.removeAttribute("srcset");
			}
			this.saveModification(img, newSrc, oldSrc, "image");
		}
	}
}

const cleanPattern = (pattern: RegExp) =>
	pattern.toString().replaceAll("/", "").replace("gi", "");

const createTreeWalker = (
	rootElement: Node,
	iterator: (textNode: Node) => void,
	appliedReplacements: HTMLElement[] = [],
) => {
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
		// preventing processing already applied nodes and the empty ones.
		if (
			(textNode.parentElement &&
				appliedReplacements.includes(textNode.parentElement)) ||
			textNode.nodeValue === null ||
			!textNode?.textContent?.trim()
		) {
			continue;
		}

		iterator(textNode);
	} while (treeWalker.nextNode());
};

const fillReplacements = (
	textNode: Node,
	oldTextPattern: RegExp,
	newText: string,
	fragmentsToHighlight: Node[],
	replacements: { nodeToReplace: Node; replacement: Node }[],
	fragmentTextNode: FragmentTextNode,
	saveModification: SaveModification,
) => {
	if (!textNode || !textNode.nodeValue) {
		return;
	}
	const matches = [...textNode.nodeValue.matchAll(oldTextPattern)];
	if (matches.length > 0) {
		const fragmentedTextNode = fragmentTextNode(
			fragmentsToHighlight,
			matches,
			textNode,
			newText,
		);
		replacements.push({
			nodeToReplace: textNode,
			replacement: fragmentedTextNode as Node,
		});
		saveModification(
			textNode.parentElement as HTMLElement,
			newText,
			cleanPattern(oldTextPattern),
			"text",
		);
	}
};

export const replaceFirstLetterCase = (value: string) => {
	return (match: string) => {
		if (match[0]?.toLowerCase() !== match[0]?.toUpperCase()) {
			// Check if the first character is alphabetical
			if (match[0] === match[0]?.toUpperCase()) {
				return value.charAt(0).toUpperCase() + value.slice(1);
			}
		}
		return value;
	};
};

const toRegExpPattern = (pattern: string | RegExp) => {
	if (typeof pattern === "string") {
		return new RegExp(pattern, "ig");
	}

	return pattern;
};
