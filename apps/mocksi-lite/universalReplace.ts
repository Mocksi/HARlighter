class UniversalReplace {
	observer: MutationObserver | undefined;
	patterns: { pattern: RegExp; replace: string }[] = [];

	addPattern(pattern: string | RegExp, replace: string) {
		this.patterns.push({ pattern: toRegExpPattern(pattern), replace });

		if (!this.observer) {
			this.createObserver();
		}
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

	createObserver() {
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
					for (const node of mutation.addedNodes) {
						if (
							node instanceof Text &&
							node.parentElement &&
							!(node.parentElement instanceof HTMLScriptElement) &&
							!(node.parentElement instanceof HTMLStyleElement) &&
							node.textContent !== null &&
							!/^\s*$/.test(node.textContent)
						) {
							const replace = this.matchReplacePattern(node.textContent);
							if (replace) {
								const treeWalker = document.createTreeWalker(
									node,
									NodeFilter.SHOW_TEXT,
								);
								let textNode;
								do {
									textNode = treeWalker.currentNode;
									if (textNode.nodeValue === null) continue;
									textNode.nodeValue = textNode.nodeValue.replace(
										replace.pattern,
										replaceFirstLetterCase(replace.replace),
									);
								} while (treeWalker.nextNode());
							}
						}
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
		return new RegExp("\\b" + pattern + "\\b", "ig");
	}

	return pattern;
};

export default new UniversalReplace();
