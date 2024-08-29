import type {
  AppliedModifications,
  DomJsonExportNode,
  Highlighter,
  ModificationRequest,
} from "./interfaces";
import { htmlElementToJson } from "./main";
import {
  AppliedModificationsImpl,
  generateModifications,
} from "./modifications";
import { ReactorMutationObserver } from "./mutationObserver";

/**
 * Reactor applied modifications to the current page. Modifications
 * are applied in the order they were added. Removing a modification
 * unapplies it.
 */
class Reactor {
  private mutationObserver: ReactorMutationObserver;
  private attached = false;

  doc?: Document = undefined;
  private highlighter?: Highlighter = undefined;
  private modifications: ModificationRequest[] = [];
  private appliedModifications: AppliedModificationsImpl[] = [];

  constructor() {
    this.mutationObserver = new ReactorMutationObserver(this);
  }

  /**
   * Attach Reactor to the current tab. Reactor will start generating
   * events and apply any modifications.
   *
   * @param root The document to attach to
   */
  async attach(root: Document, highlighter: Highlighter): Promise<void> {
    if (this.attached) {
      throw new Error("Reactor is already attached");
    }

    this.doc = root;
    this.highlighter = highlighter;
    this.attached = true;

    // apply all modifications
    for (const modification of this.modifications) {
      this.appliedModifications.push(
        await generateModifications(modification, root, highlighter),
      );
    }

    // attach mutation observer after all modifications are applied
    this.mutationObserver.attach(root);
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
  async detach(clearModifications = true): Promise<void> {
    this.mutationObserver.detach();

    // clear any applied modifications
    if (clearModifications) {
      await this.clearAppliedModifications();
    }

    this.attached = false;
    this.appliedModifications = [];
  }

  /**
   * Returns an iterable object that allows iteration over the applied modifications.
   *
   * @return {Iterable<AppliedModifications>} An iterable object that allows iteration over the applied modifications.
   */
  getAppliedModifications(): Iterable<AppliedModifications> {
    const index = 0;
    const outerThis = this;
    return {
      [Symbol.iterator](): Iterator<AppliedModifications> {
        let index = 0;
        return {
          next: () => {
            if (index < outerThis.appliedModifications.length) {
              return {
                done: false,
                value:
                  outerThis.appliedModifications[index++] ||
                  new AppliedModificationsImpl(
                    {
                      description: "No modifications",
                      modifications: [],
                    },
                    outerThis.highlighter,
                  ),
              };
            }

            return { done: true, value: undefined };
          },
        };
      },
    };
  }

  /**
   * Export the DOM as an array of `DomJsonExportNode` objects.
   *
   * @param {HTMLElement | null} element - The element to export. If not provided, the entire body of the attached document will be exported.
   * @throws {Error} If the reactor is not attached and no element is specified.
   * @return {DomJsonExportNode[]} An array of `DomJsonExportNode` objects representing the exported DOM.
   */
  exportDOM(element: null | HTMLElement = null): DomJsonExportNode[] {
    let useElement = element;

    if (!useElement) {
      if (this.attached && this.doc) {
        useElement = this.doc.body;
      } else {
        throw new Error("Not attached");
      }
    }

    return htmlElementToJson(useElement);
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

    const toApply = Array.isArray(modificationRequest)
      ? modificationRequest
      : [modificationRequest];
    for (const modification of toApply) {
      this.modifications.push(modification);

      if (this.isAttached() && this.doc) {
        // disable the mutation listener while we make our changes
        this.mutationObserver.detach();

        const applied = await generateModifications(
          modification,
          this.doc,
          this.highlighter,
        );
        out.push(applied);
        this.appliedModifications.push(applied);
      
        // re-enable the mutation listener
        this.mutationObserver.attach(this.doc);
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
  async popModification(count = 1): Promise<AppliedModifications[]> {
    const out: AppliedModifications[] = [];
    for (let i = 0; i < count; i++) {
      const modification = this.modifications.pop();

      if (this.isAttached() && this.doc) {
        // disable the mutation listener while we make our changes
        this.mutationObserver.detach();

        const applied = this.appliedModifications.pop();
        if (applied) {
          applied.setHighlight(false);
          applied.unapply();
          out.push(applied);
        }

        // re-enable the mutation listener
        this.mutationObserver.attach(this.doc);
      }
    }

    return out;
  }

  /**
   * Clear all modifications applied
   */
  async clearAppliedModifications(): Promise<void> {
    await this.popModification(this.appliedModifications.length);
  }
}

export default Reactor;