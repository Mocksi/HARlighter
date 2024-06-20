type FragmentTextNode = (
	fragmentsToHighlight: Node[],
	matches: RegExpMatchArray[],
	textNode: Node,
	newText: string,
) => Node;

interface ContentHighlighterInterface {
	highlightNode(node: Node): void;
}

type SaveModification = (
	element: HTMLElement,
	newText: string,
	cleanPattern: string,
) => void;

class DomManipulator {
	private observer: MutationObserver | undefined;
	private patterns: { pattern: RegExp; replace: string }[] = [];

	constructor(
		private fragmentTextNode: FragmentTextNode,
		private contentHighlighter: ContentHighlighterInterface,
		private saveModification: SaveModification,
	) {}

	addPattern(pattern: string | RegExp, replace: string) {
		const replacePattern = { pattern: toRegExpPattern(pattern), replace };
		this.patterns.push(replacePattern);
		this.seekAndReplace(replacePattern.pattern, replacePattern.replace);
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

	seekAndReplace(pattern: RegExp, newText: string) {
		const body = document.querySelector("body");
		if (!body) {
			console.log("Body not found");
			return;
		}
		const fragmentsToHighlight: Node[] = [];
		const replacements: { nodeToReplace: Node; replacement: Node }[] = [];
		createTreeWalker(body, (textNode) => {
			if (!textNode.nodeValue) {
				return;
			}
			const matches = [...textNode.nodeValue.matchAll(pattern)];
			if (matches.length > 0) {
				const fragmentedTextNode = this.fragmentTextNode(
					fragmentsToHighlight,
					matches,
					textNode,
					newText,
				);
				replacements.push({
					nodeToReplace: textNode,
					replacement: fragmentedTextNode as Node,
				});
				this.saveModification(
					textNode.parentElement as HTMLElement,
					newText,
					cleanPattern(pattern),
				);
			}
		});

		for (const { nodeToReplace, replacement } of replacements) {
			if (nodeToReplace.parentElement == null) {
				continue;
			}
			nodeToReplace.parentElement.replaceChild(replacement, nodeToReplace);
		}

		for (const fragment of fragmentsToHighlight) {
			this.contentHighlighter.highlightNode(fragment);
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
}

const cleanPattern = (pattern: RegExp) =>
	pattern.toString().replaceAll("/", "").replace("gi", "");

const createTreeWalker = (
	rootElement: Node,
	iterator: (textNode: Node) => void,
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
		if (textNode.nodeValue === null || !textNode?.textContent?.trim()) {
			continue;
		}

		iterator(textNode);
	} while (treeWalker.nextNode());
};

const replaceFirstLetterCase = (value: string) => {
	return (match: string) => {
		if (match[0] === match[0].toUpperCase()) {
			return value.charAt(0).toUpperCase() + value.slice(1);
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

export default DomManipulator;
