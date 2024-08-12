import { UUIDGenerator } from "../utils/UUIDGenerator";

type FragmentTextNodeFunction = (
	fragmentsToHighlight: Node[],
	matches: RegExpMatchArray[],
	textNode: Node,
	newText: string,
) => null | DocumentFragment;

type SaveModificationFunction = (
	element: HTMLElement,
	newText: string,
	pattern: string,
) => void;
export class ShadowDOMManipulator {
	private shadowRoot: ShadowRoot;
	private snapshots: string[] = [];
	private modifiedNodes: Map<string, HTMLElement> = new Map();
	private uuidGenerator: UUIDGenerator;
	private patterns: { pattern: RegExp; replace: string }[] = [];
	private observer: undefined | MutationObserver;
	// TODO: move these functions out of actions.ts into dodom/utils
	private fragmentTextNode: FragmentTextNodeFunction;
	private saveModification: SaveModificationFunction;
	// FIXME: this should not be any
	// biome-ignore lint/suspicious/noExplicitAny: will fix in a separate PR
	private contentHighlighter: any;

	constructor(
		shadowRoot: ShadowRoot,
		fragmentTextNode: FragmentTextNodeFunction,
		saveModification: SaveModificationFunction,
		// FIXME: this should not be any
		// biome-ignore lint/suspicious/noExplicitAny: will fix in a separate PR
		contentHighlighter: any,
		uuidGenerator?: UUIDGenerator,
	) {
		this.shadowRoot = shadowRoot;
		this.uuidGenerator = uuidGenerator || new UUIDGenerator();
		this.createObserver();
		this.fragmentTextNode = fragmentTextNode;
		this.saveModification = saveModification;
		this.contentHighlighter = contentHighlighter;
	}

	replaceImage(oldSrc: string, newSrc: string, nodeId?: string): string {
		const img = this.shadowRoot.querySelector(
			`img[src="${oldSrc}"]`,
		) as HTMLImageElement;
		if (img) {
			let newNodeId = nodeId;
			if (!newNodeId) {
				newNodeId = this.uuidGenerator.generate();
			}
			img.setAttribute("data-mocksi-id", newNodeId);
			this.snapshots.push(this.shadowRoot.innerHTML);
			img.src = newSrc;
			this.modifiedNodes.set(newNodeId, img);
			return newNodeId;
		}
		throw new Error("Image with the specified source not found.");
	}

	undo(): void {
		if (this.snapshots.length > 0) {
			const lastSnapshot = this.snapshots.pop();
			if (lastSnapshot) {
				this.shadowRoot.innerHTML = lastSnapshot;
			}
		}
	}

	getModifiedNodes(): string[] {
		return Array.from(this.modifiedNodes.keys());
	}

	addPattern(pattern: RegExp | string, replace: string) {
		const replacePattern = { pattern: this.toRegExpPattern(pattern), replace };
		this.patterns.push(replacePattern);
		this.seekAndReplace(replacePattern.pattern, replacePattern.replace);
	}

	removePattern(pattern: RegExp | string) {
		const pattern_ = this.toRegExpPattern(pattern);
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
	applyPatterns() {
		for (const pattern of this.patterns) {
			this.seekAndReplace(pattern.pattern, pattern.replace);
		}
	}

	seekAndReplace(pattern: RegExp, newText: string) {
		const fragmentsToHighlight: Node[] = [];
		const replacements: { nodeToReplace: Node; replacement: Node }[] = [];
		this.createTreeWalker(this.shadowRoot, (textNode) => {
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
					this.cleanPattern(pattern),
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

	private createObserver() {
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						this.createTreeWalker(node, (textNode) => {
							if (!textNode.textContent || !textNode.nodeValue) {
								return;
							}

							const replace = this.matchReplacePattern(textNode.textContent);
							if (replace) {
								textNode.nodeValue = textNode.nodeValue.replace(
									replace.pattern,
									this.replaceFirstLetterCase(replace.replace),
								);
							}
						});
					}
				}
			}
		});
		this.observer.observe(this.shadowRoot, { childList: true, subtree: true });
	}

	disconnectObserver() {
		this.observer?.disconnect();
	}

	private matchReplacePattern(
		text: string,
	): null | { pattern: RegExp; replace: string } {
		for (const pattern of this.patterns) {
			if (pattern.pattern.test(text)) {
				return { pattern: pattern.pattern, replace: pattern.replace };
			}
		}

		return null;
	}

	private createTreeWalker(
		rootElement: Node,
		iterator: (textNode: Node) => void,
	) {
		const treeWalker = document.createTreeWalker(
			rootElement,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode: (node) => {
					if (
						node.parentElement instanceof HTMLScriptElement ||
						node.parentElement instanceof HTMLStyleElement
					) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				},
			},
		);

		let textNode: Node;
		while (treeWalker.nextNode()) {
			textNode = treeWalker.currentNode;
			if (textNode.nodeValue === null || !textNode?.textContent?.trim()) {
				continue;
			}

			iterator(textNode);
		}
	}

	private replaceFirstLetterCase(value: string) {
		return (match: string) => {
			const firstLetterUpper = match.charAt(0).toUpperCase();
			if (match[0] === firstLetterUpper) {
				return value.charAt(0).toUpperCase() + value.slice(1);
			}
			return value;
		};
	}

	private toRegExpPattern(pattern: RegExp | string): RegExp {
		if (typeof pattern === "string") {
			return new RegExp(pattern, "g");
		}
		return pattern;
	}

	private cleanPattern(pattern: RegExp): string {
		return pattern.toString().replaceAll("/", "").replace("g", "");
	}

	serializeShadowDOM(): string {
		return new XMLSerializer().serializeToString(this.shadowRoot);
	}
}
