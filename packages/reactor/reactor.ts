import type { AppliedModifications, ModificationRequest } from "./interfaces";
import { ReactorMutationObserver } from "./mutationObserver";

/**
 * Reactor applied modifications to the current page. Modifications
 * are applied in the order they were added. Removing a modification
 * unapplies it.
 */
class Reactor {
	private mutationObserver: ReactorMutationObserver;
	private attached = false;

	private appliedModifications: AppliedModifications[] = [];

	constructor() {
		this.mutationObserver = new ReactorMutationObserver();
	}

	/**
	 * Attach Reactor to the current tab. Reactor will start generating
	 * events and apply any modifications.
	 *
	 * @param root The document to attach to
	 */
	attach(root: Document): void {
		this.mutationObserver.attach(root);
		this.attached = true;
	}

	/**
	 * Returns a boolean indicating whether the object is attached.
	 *
	 * @return {boolean} A boolean indicating whether the object is attached.
	 */
	isAttached(): boolean {
		return this.attached;
	}

	/**
	 * Detach Reactor from the current tab. Reactor will remove any applied
	 * modifications and stop generating events.
	 */
	detach(): void {
		this.mutationObserver.detach();
		this.attached = false;
	}

	getAppliedModifications(): Iterable<AppliedModifications> {
		const index = 0;
		return {
			[Symbol.iterator](): Iterator<AppliedModifications> {
				let index = 0;
				return {
					next: () => {
						if (index < this.appliedModifications.length) {
							return { value: this.appliedModifications[index++], done: false };
						}

						return { value: undefined, done: true };
					},
				};
			},
		};
	}

	/**
	 * Pushes a modification request or an array of modification requests to the stack.
	 *
	 * @param {ModificationRequest | ModificationRequest[]} modificationRequest - The modification request or array of modification requests to be pushed.
	 * @return {ModificationRequest | ModificationRequest[]} the applied modifications
	 */
	pushModification(
		modificationRequest: ModificationRequest | ModificationRequest[],
	): Promise<AppliedModifications | AppliedModifications[]> {
		throw new Error("Method not implemented.");
	}

	/**
	 * Removes the specified number of modifications from the stack.
	 *
	 * @param {number} count - The number of modifications to remove. Defaults to 1.
	 * @return {ModificationRequest | ModificationRequest[]} the applied modifications
	 */
	popModification(
		count = 1,
	): Promise<AppliedModifications | AppliedModifications[]> {
		throw new Error("Method not implemented.");
	}
}
