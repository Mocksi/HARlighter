import { UUIDGenerator } from '../utils/UUIDGenerator';

export class ShadowDOMManipulator {
    private shadowRoot: ShadowRoot;
    private snapshots: string[] = [];
    private modifiedNodes: Map<string, HTMLElement> = new Map();
    private uuidGenerator: UUIDGenerator;

    constructor(shadowRoot: ShadowRoot, uuidGenerator?: UUIDGenerator) {
        this.shadowRoot = shadowRoot;
        this.uuidGenerator = uuidGenerator || new UUIDGenerator();
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
}