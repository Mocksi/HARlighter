import type { AppliedModifications, ModificationRequest } from "./interfaces";
import { ReactorMutationObserver } from "./mutationObserver";
import { generateModifications, AppliedModificationsImpl } from "./utils";

/**
 * Reactor applied modifications to the current page. Modifications
 * are applied in the order they were added. Removing a modification
 * unapplies it.
 */
class Reactor {
	private mutationObserver: ReactorMutationObserver;
	private attached = false;

	private doc: Document | undefined = undefined;
	private modifications: ModificationRequest[] = [];
	private appliedModifications: AppliedModificationsImpl[] = [];

	constructor() {
		this.mutationObserver = new ReactorMutationObserver();
	}

	/**
	 * Attach Reactor to the current tab. Reactor will start generating
	 * events and apply any modifications.
	 *
	 * @param root The document to attach to
	 */
	async attach(root: Document): Promise<void> {
		if (this.attached) {
			throw new Error('Reactor is already attached');	
		}

		this.doc = root;
		this.mutationObserver.attach(root);
		this.attached = true;
		
		// apply all modifications
		for (const modification of this.modifications) {
			this.appliedModifications.push(
				await generateModifications(modification, root),
			)
		}
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
	async detach(): Promise<void> {
		this.mutationObserver.detach();
		this.attached = false;

		// clear any applied modifications
		this.appliedModifications = [];
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
	async pushModification(
		modificationRequest: ModificationRequest | ModificationRequest[],
	): Promise<AppliedModifications[]> {
		const out: AppliedModifications[] = [];

		const toApply = Array.isArray(modificationRequest) ? modificationRequest : [modificationRequest];
		for (const modification of toApply) {
			this.modifications.push(modification);

			if (this.isAttached()) {
				const applied = await generateModifications(modification, this.doc!);
				out.push(applied);
				this.appliedModifications.push(applied);
			}
		}

		return out;
	}

	/**
	 * Removes the specified number of modifications from the stack.
	 *
	 * @param {number} count - The number of modifications to remove. Defaults to 1.
	 * @return {AppliedModification[]} the applied modifications
	 */
	async popModification(
		count: number = 1,
	): Promise<AppliedModifications[]> {
		const out: AppliedModifications[] = [];
		for (let i = 0; i < count; i++) {
			const modification = this.modifications.pop();

			if (this.isAttached()) {
				const applied = this.appliedModifications.pop();
				if (applied) {
					applied!.unapply();
					out.push(applied!);
				}
			}
		}

		return out;
	}
}
