import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import DomManipulator from '../../receivers/DOMManipulator';

const mockFragmentTextNode = vi.fn();
const mockContentHighlighter = {
    highlightNode: vi.fn(),
};
const mockSaveModification = vi.fn();
global.MutationObserver = vi.fn(function MutationObserver(callback) {
    return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(),
        callback
    };
});


describe('DomManipulator', () => {
    let domManipulator: DomManipulator;

    beforeEach(() => {
        domManipulator = new DomManipulator(
            mockFragmentTextNode,
            mockContentHighlighter,
            mockSaveModification
        );
        vi.spyOn(domManipulator, 'matchReplacePattern');
        vi.spyOn(domManipulator, 'handleMutations');
        vi.spyOn(domManipulator, 'handleMutation');
        vi.spyOn(domManipulator, 'handleAddedNode');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should add a pattern and call seekAndReplace', () => {
        const pattern = 'test';
        const replace = 'replace';

        vi.spyOn(domManipulator, 'seekAndReplace');

        domManipulator.addPattern(pattern, replace);

        expect(domManipulator.seekAndReplace).toHaveBeenCalledWith(expect.any(RegExp), replace);
        expect(domManipulator['patterns'].length).toBe(1);
    });

    it('should remove a pattern', () => {
        const pattern = 'test';
        const replace = 'replace';

        domManipulator.addPattern(pattern, replace);
        domManipulator.removePattern(pattern);

        expect(domManipulator['patterns'].length).toBe(0);
    });

    it('should match replace pattern', () => {
        const pattern = 'test';
        const replace = 'replace';

        domManipulator.addPattern(pattern, replace);

        const match = domManipulator.matchReplacePattern('test string');

        expect(match).not.toBeNull();
        expect(match?.pattern).toEqual(new RegExp(pattern, 'ig'));
        expect(match?.replace).toBe(replace);
    });

    describe('createObserver', () => {
        it('should create an observer and observe the document', () => {
            domManipulator.createObserver();
            expect(domManipulator['observer']).toBeDefined();
            expect(domManipulator['observer']?.observe).toHaveBeenCalledWith(document, { childList: true, subtree: true });
        });

        it('should handle mutations', () => {
            const mutations: MutationRecord[] = [{ addedNodes: [] } as any];
            domManipulator['handleMutations'](mutations);
            expect(domManipulator['handleMutation']).toHaveBeenCalled();
        });

        it('should handle added nodes', () => {
            const node = document.createTextNode('test');
            domManipulator['handleAddedNode'](node);
            expect(domManipulator['matchReplacePattern']).toHaveBeenCalledWith('test');
        });
    });
});