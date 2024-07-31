import { AppliedModification, ModificationRequest, Reactor } from './interfaces';
import { ReactorMutationObserver } from './mutationObserver';

class ReactorImpl implements Reactor {
    private mutationObserver: ReactorMutationObserver;
    private attached: boolean = false;

    constructor() {
        this.mutationObserver = new ReactorMutationObserver();
    }

    attach(root: Document): void {
        this.mutationObserver.attach(root);
        this.attached = true;
    }

    detach(): void {
        this.mutationObserver.detach();
        this.attached = false;
    }

    getAppliedModifications(): AppliedModification[] {
        throw new Error('Method not implemented.');
    }

    addModification(modificationRequest: ModificationRequest): void {
        throw new Error('Method not implemented.');
    }

    removeLastModification(): void {
        throw new Error('Method not implemented.');
    }
}