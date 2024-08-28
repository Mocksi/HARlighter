import Reactor from "./reactor";
import { AppliedModificationsImpl } from "./modifications";
import { applyModification, matchesSelector } from "./modifications";

export class ReactorMutationObserver {
	private reactor: Reactor;
	private observer: MutationObserver | undefined;

	constructor(reactor: Reactor) {
		this.reactor = reactor;
	}

	attach(root: Document) {
		this.observer = new MutationObserver(this.handleMutations.bind(this));
		this.observer.observe(root, { childList: true, subtree: true });
	}

	detach() {
		this.observer?.disconnect();
	}

	handleMutations(mutations: MutationRecord[]) {
		for (const mutation of mutations) {
			this.handleMutation(mutation);
		}
	}

	handleMutation(mutation: MutationRecord) {
		console.debug(`Mutation: ${mutation.type} added: ${mutation.addedNodes.length} removed: ${mutation.removedNodes.length}`);
		for (const node of mutation.addedNodes) {
			console.debug(`   Added: ${printNode(node)}`);
			if (node instanceof Element) {
				this.walkAddedElements(node);
			}
		}
		for (const node of mutation.removedNodes) {
			console.debug(`   Removed: ${printNode(node)}`);
			if (node instanceof Element) {
				this.walkRemovedElements(node);	
			}
		}
	}

	walkAddedElements(element: Element) {
		const treeWalker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_ELEMENT,
			null
		);
 
		do {
			const node = treeWalker.currentNode;
			if (node instanceof Element) {
				const applied = Array.from(this.reactor.getAppliedModifications()) as AppliedModificationsImpl[];
				for (const modification of applied) {
					const reqs = modification.modificationRequest;
					for (const req of reqs.modifications) {
						if (this.reactor.doc && matchesSelector(node, req)) {
							// apply modificaiton, but don't wait for result in mutation observer
							applyModification(node, req, this.reactor.doc).then((appliedModification) => {
								modification.modifications.push(appliedModification);
							});
						}
					}
				}
			}
		} while (treeWalker.nextNode());
	}

	walkRemovedElements(element: Element) {
		const treeWalker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_ELEMENT,
			null
		);
 
		do {
			const node = treeWalker.currentNode;
			if (node instanceof Element) {
				const mocksiId = node.getAttribute("mocksi-id");
				if (mocksiId) {
					for (const attributes of node.attributes) {
						if (attributes.name.startsWith("mocksi-modified-")) {
							const modificationId = attributes.name.substring("mocksi-modified-".length);
							console.debug(`     Modified by: ${modificationId}`);
							this.removeModifiedElement(node, mocksiId, modificationId);
						}
					}
				}
			}
		} while (treeWalker.nextNode());
	}

	removeModifiedElement(element: Element, elementId: string, modificationId: string) {
		const applied = Array.from(this.reactor.getAppliedModifications()) as AppliedModificationsImpl[];
		for (const modification of applied) {
			for (const [index, mod] of modification.modifications.entries()) {
				if (mod.uuid === modificationId) {
					const remove = mod.modifiedElementRemoved(element, elementId);
					if (remove) {
						modification.modifications.splice(index, 1);	
					}
					return;
				}	
			}
		}
	}
}

const printNode = (node: Node) => {
	let out = node.nodeName;

	if (node instanceof Text) {
		out += `: ${node.nodeValue}`;
	}

	if (node instanceof Element) {
		const mocksiId = node.getAttribute("mocksi-id");
		if (mocksiId) {
			out += ` (mocksi-id: ${mocksiId})`;
		}
	}

	return out;
}
