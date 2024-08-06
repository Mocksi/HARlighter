export class ReactorMutationObserver {
	private observer: MutationObserver | undefined;

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

	handleMutation(mutation: MutationRecord) {}
}
