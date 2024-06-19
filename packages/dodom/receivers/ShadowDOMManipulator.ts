import { UUIDGenerator } from '../utils/UUIDGenerator';

export class ShadowDOMManipulator {
    private shadowRoot: ShadowRoot;
    private snapshots: string[] = [];
    private modifiedNodes: Map<string, HTMLElement> = new Map();
    private uuidGenerator: UUIDGenerator;
    private patterns: { pattern: RegExp; replace: string }[] = [];
    private observer: MutationObserver | undefined;

    constructor(shadowRoot: ShadowRoot, uuidGenerator?: UUIDGenerator) {
        this.shadowRoot = shadowRoot;
        this.uuidGenerator = uuidGenerator || new UUIDGenerator();
        this.initializeObserver();
    }

    replaceImage(oldSrc: string, newSrc: string, nodeId?: string): string {
        const img = this.shadowRoot.querySelector(`img[src="${oldSrc}"]`) as HTMLImageElement;
        if (img) {
            if (!nodeId) {
                nodeId = this.uuidGenerator.generate();
                img.setAttribute('data-mocksi-id', nodeId);
            } else {
                img.setAttribute('data-mocksi-id', nodeId);
            }
            this.snapshots.push(this.shadowRoot.innerHTML);
            img.src = newSrc;
            this.modifiedNodes.set(nodeId, img);
            return nodeId;
        }
        throw new Error('Image with the specified source not found.');
    }

    undo(): void {
        if (this.snapshots.length > 0) {
            const lastSnapshot = this.snapshots.pop()!;
            this.shadowRoot.innerHTML = lastSnapshot;
        }
    }

    getModifiedNodes(): string[] {
        return Array.from(this.modifiedNodes.keys());
    }

    addPattern(pattern: string | RegExp, replace: string) {
        const replacePattern = { pattern: this.toRegExpPattern(pattern), replace };
        this.patterns.push(replacePattern);
        this.applyPatterns();
    }

    removePattern(pattern: string | RegExp) {
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

    private toRegExpPattern(pattern: string | RegExp): RegExp {
        if (typeof pattern === 'string') {
            return new RegExp(pattern, 'ig');
        }
        return pattern;
    }

    private seekAndReplace(pattern: RegExp, replace: string) {
        const walker = document.createTreeWalker(
            this.shadowRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node || !node.nodeValue) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node: Text;
        const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
        while (node = walker.nextNode() as Text) {
            if (!node || !node.nodeValue) {
                return;
            }
            node.nodeValue = node.nodeValue.replaceAll(globalPattern, replace);
        }
    }

    private initializeObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.applyPatternsToNode(node as Element);
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    this.applyPatterns();
                }
            });
        });

        this.observer.observe(this.shadowRoot, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    applyPatterns() {
        this.patterns.forEach(({ pattern, replace }) => {
            this.seekAndReplace(pattern, replace);
        });
    }

    private applyPatternsToNode(node: Element) {
        this.patterns.forEach(({ pattern, replace }) => {
            if (!node) {
                return;
            }
            const textContent = node.textContent;
            if (!textContent) {
                return;
            }
            if (pattern.test(textContent)) {
                node.textContent = textContent.replaceAll(new RegExp(pattern.source, 'g'), replace);
            }
        });
    }

    disconnectObserver() {
        this.observer?.disconnect();
    }

    serializeShadowDOM(): string {
        return new XMLSerializer().serializeToString(this.shadowRoot);
    }
}
