import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShadowDOMManipulator } from '../../receivers/ShadowDOMManipulator';
import { UUIDGenerator } from '../../utils/UUIDGenerator';

describe('ShadowDOMManipulator', () => {
    let shadowRoot: ShadowRoot;
    let uuidGenerator: UUIDGenerator;
    let manipulator: ShadowDOMManipulator;

    beforeEach(() => {
        const shadowHost = document.createElement('div');
        shadowHost.id = 'my-shadow-root';
        document.body.appendChild(shadowHost);
        shadowRoot = shadowHost.attachShadow({ mode: 'open'});
        uuidGenerator = {
            generate: () => 'mocksi-1234'
        } as UUIDGenerator;
        manipulator = new ShadowDOMManipulator(shadowRoot, uuidGenerator);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        manipulator.disconnectObserver();
    });

    it('should replace image source and undo the replacement', () => {
        shadowRoot.innerHTML = '<img src="https://example.com/old.jpg" alt="Old Image 1">';
        manipulator.replaceImage('https://example.com/old.jpg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=');
        expect(shadowRoot.innerHTML).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=');
        expect(shadowRoot.innerHTML).toContain('mocksi-1234');

        manipulator.undo();
        expect(shadowRoot.innerHTML).toContain('https://example.com/old.jpg');
    });

    it('should throw an error if image not found', () => {
        expect(() => manipulator.replaceImage('nonexistent.jpg', 'newSrc.jpg')).toThrow('Image with the specified source not found.');
    });

    it('should replace text nodes matching pattern', () => {
        shadowRoot.innerHTML = '<div>Test text</div>';
        manipulator.addPattern('Test', 'Replaced');

        const div = shadowRoot.querySelector('div');
        expect(div?.textContent).toBe('Replaced text');
    });

    it('should apply patterns on DOM changes', () => {
        shadowRoot.innerHTML = '<div>Test text</div>';
        expect(manipulator.serializeShadowDOM()).toBe('<div xmlns="http://www.w3.org/1999/xhtml">Test text</div>');

        manipulator.addPattern('Test', 'Replaced');
        expect(manipulator.serializeShadowDOM()).toEqual('<div xmlns="http://www.w3.org/1999/xhtml">Replaced text</div>');

        shadowRoot.innerHTML += '<div>Test new text</div>';
        expect(manipulator.serializeShadowDOM()).toEqual('<div xmlns="http://www.w3.org/1999/xhtml">Replaced text</div><div xmlns="http://www.w3.org/1999/xhtml">Test new text</div>');
        
        // FIXME: applyPatterns should be called automatically when DOM changes
        manipulator.applyPatterns();
        const divs = shadowRoot.querySelectorAll('div');
        expect(manipulator.serializeShadowDOM()).toBe('<div xmlns="http://www.w3.org/1999/xhtml">Replaced text</div><div xmlns="http://www.w3.org/1999/xhtml">Replaced new text</div>');
        expect(divs[0]?.textContent).toBe('Replaced text');
        expect(divs[1]?.textContent).toBe('Replaced new text');
    });

    it('should handle multiple patterns correctly', () => {
        shadowRoot.innerHTML = '<div>Test text and another test</div>';
        manipulator.addPattern('Test', 'Replaced');
        manipulator.addPattern('another', 'different');

        const div = shadowRoot.querySelector('div');
        expect(div?.textContent).toBe('Replaced text and different Replaced');
    });

    it('should remove pattern', () => {
        shadowRoot.innerHTML = '<div>Test text</div>';
        manipulator.addPattern('Test', 'Replaced');
        manipulator.removePattern('Test');
        shadowRoot.innerHTML += '<div>Test text</div>';
        manipulator.applyPatterns();
        expect(manipulator.serializeShadowDOM()).toBe('<div xmlns="http://www.w3.org/1999/xhtml">Replaced text</div><div xmlns="http://www.w3.org/1999/xhtml">Test text</div>');
        
    });
});
