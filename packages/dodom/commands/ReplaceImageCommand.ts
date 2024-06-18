import { Command } from './Command';
import { ShadowDOMManipulator } from '../receivers/ShadowDOMManipulator';

export class ReplaceImageCommand implements Command {
    private manipulator: ShadowDOMManipulator;
    private oldSrc: string;
    private newSrc: string;
    private nodeId: string | null;

    constructor(manipulator: ShadowDOMManipulator, oldSrc: string, newSrc: string) {
        this.manipulator = manipulator;
        this.oldSrc = oldSrc;
        this.newSrc = newSrc;
        this.nodeId = null;
    }

    execute(): void {
        this.nodeId = this.manipulator.replaceImage(this.oldSrc, this.newSrc);
    }

    undo(): void {
        if (this.nodeId) {
            this.manipulator.replaceImage(this.newSrc, this.oldSrc, this.nodeId);
        }
    }
}