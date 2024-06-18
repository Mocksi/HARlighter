import { fragmentTextNode } from "./content/EditMode/actions";
import { ContentHighlighter } from "./content/EditMode/highlighter";
import { saveModification } from "./utils";

class UniversalReplace {
	observer: MutationObserver | undefined;
	patterns: { pattern: RegExp; replace: string }[] = [];

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
		if (idx >= 0) this.patterns.splice(idx, 1);

		if (this.patterns.length === 0) {
			this.observer?.disconnect();
			this.observer = undefined;
		}
	}

	seekAndReplace(pattern: RegExp, newText: string) {
		const body = document.querySelector("body");
		if (body) {
			const fragmentsToHighlight: Node[] = [];
			const replacements: { nodeToReplace: Node; replacement: Node }[] = [];
			createTreeWalker(body, (textNode) => {
				if (!textNode.nodeValue) return null;
				const matches = [...textNode.nodeValue.matchAll(pattern)];
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
						cleanPattern(pattern),
					);
				}
			});
			//biome-ignore lint/complexity/noForEach: I'll replace later
			replacements.forEach(({ nodeToReplace, replacement }) => {
				if (nodeToReplace.parentElement)
					nodeToReplace.parentElement.replaceChild(replacement, nodeToReplace);
				// TODO: see how we should manage if has no parent, couldnt find a case for this.
			});
			//biome-ignore lint/complexity/noForEach: I'll replace later
			fragmentsToHighlight.forEach((fragment) =>
				ContentHighlighter.highlightNode(fragment),
			);
		}
	}

	// TODO need to execute this when the user presses "play"
	createObserver() {
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						createTreeWalker(node, (textNode) => {
							if (!textNode.textContent || !textNode.nodeValue) return null;
							const replace = this.matchReplacePattern(textNode.textContent);
							if (replace) {
								textNode.nodeValue = textNode.nodeValue.replace(
									replace.pattern,
									replaceFirstLetterCase(replace.replace),
								);
							}
						});
					}
				}
			}
		});
		this.observer.observe(document, { childList: true, subtree: true });
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
			)
				return NodeFilter.FILTER_REJECT;
			return NodeFilter.FILTER_ACCEPT;
		},
	);
	let textNode: Node;
	do {
		textNode = treeWalker.currentNode;
		if (textNode.nodeValue === null || !textNode?.textContent?.trim()) continue;
		iterator(textNode);
	} while (treeWalker.nextNode());
};

const replaceFirstLetterCase = (value: string) => {
	return (match: string) => {
		// Check if the first letter in the match is uppercase
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

export default new UniversalReplace();
