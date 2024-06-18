import { fragmentTextNode } from "./content/EditMode/actions";
import { ContentHighlighter } from "./content/EditMode/highlighter";
import { saveModification } from "./utils";

class UniversalReplace {
    observer: MutationObserver | undefined;
    patterns: { pattern: RegExp, replace: string }[] = [];

    addPattern(pattern: string | RegExp, replace: string) {
        const replacePattern = { pattern: toRegExpPattern(pattern), replace }
        this.patterns.push(replacePattern);
        this.seekAndReplace(replacePattern.pattern, replacePattern.replace)
    }

    removePattern(pattern: string | RegExp) {
       const pattern_ = toRegExpPattern(pattern);
       let idx = this.patterns.findIndex(p => p.pattern.source === pattern_.source); 
       if (idx >= 0) this.patterns.splice(idx, 1);

       if (this.patterns.length === 0) {
           this.observer?.disconnect();
           this.observer = undefined;
       }
    }

    seekAndReplace(pattern: RegExp, newText: string) {
        const body = document.querySelector('body')
        if (body) {
            // TODO createTreeWalker provides a filter function, see if we can filter chunk textNodes 
            const treeWalker = document.createTreeWalker(
                body, 
                NodeFilter.SHOW_TEXT,
                (node) => {
                    if ((node.parentElement instanceof HTMLScriptElement || node.parentElement instanceof HTMLStyleElement)) return NodeFilter.FILTER_REJECT
                    else return NodeFilter.FILTER_ACCEPT
                }
            );
            let textNode: Node
            const fragmentsToHighlight: Node[] = []
            const replacements: {nodeToReplace: Node, replacement: Node}[] = []
            do {
                textNode = treeWalker.currentNode;
                if (textNode.nodeValue === null || !textNode?.textContent?.trim()) continue;
                const matches = [...textNode.nodeValue.matchAll(pattern)]
                if (matches.length > 0) {     
                    const fragmentedTextNode = fragmentTextNode(fragmentsToHighlight, matches, textNode, newText)
                    replacements.push({
                        nodeToReplace: textNode,
                        replacement: fragmentedTextNode
                    })
                    saveModification(
                        textNode.parentElement as HTMLElement,
                        newText,
                        cleanPattern(pattern)
                    )
                }
            } while (treeWalker.nextNode());
            replacements.forEach(({nodeToReplace, replacement}) => {
                if (nodeToReplace.parentElement) nodeToReplace.parentElement.replaceChild(replacement, nodeToReplace)
                // TODO: see how we should manage if has no parent, couldnt find a case for this.
            })
            fragmentsToHighlight.forEach(fragment => ContentHighlighter.highlightNode(fragment))
        }
    }


    // TODO need to execute this when the user presses "play"
    createObserver() {
        this.observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.addedNodes != null && mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node instanceof Text && 
                            node.parentElement &&
                            !(node.parentElement instanceof HTMLScriptElement) &&
                            !(node.parentElement instanceof HTMLStyleElement) &&
                            node.textContent !== null &&
                            !(/^\s*$/.test(node.textContent)))
                        {
                            const replace = this.matchReplacePattern(node.textContent);
                            if (replace) {
                                const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
                                let textNode: Node
                                do {
                                    textNode = treeWalker.currentNode;
                                    if (textNode.nodeValue === null) continue;
                                    textNode.nodeValue = textNode.nodeValue.replace(replace.pattern, replaceFirstLetterCase(replace.replace));
                                } while (treeWalker.nextNode());
                            }
                        }
                    }
                }
            }
        });

        this.observer.observe(document, { childList: true, subtree: true });
    }    

    matchReplacePattern(text: string): { pattern: RegExp, replace: string } | null {
        for (let pattern of this.patterns) {
            if (pattern.pattern.test(text)) {
                return { pattern: pattern.pattern, replace: pattern.replace }
            }
        }
    
        return null
    }
}

const cleanPattern = (pattern: RegExp) => pattern.toString().replaceAll('/', '').replace('gi', '')

const replaceFirstLetterCase = (value: string) => {
    return (match: string) => {
        // Check if the first letter in the match is uppercase
        if (match[0] === match[0].toUpperCase()) {
            return value.charAt(0).toUpperCase() + value.slice(1);
        } else {
            return value;
        }
  }
}

const toRegExpPattern = (pattern: string | RegExp) => {
    if (typeof pattern === "string") {
        return new RegExp(pattern, "ig");
    }

    return pattern;
}

export default new UniversalReplace();