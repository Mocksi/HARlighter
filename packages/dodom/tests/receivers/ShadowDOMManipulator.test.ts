import { describe, it, expect } from 'vitest';
import { ShadowDOMManipulator } from '../../receivers/ShadowDOMManipulator';
import { UUIDGenerator } from '../../utils/UUIDGenerator';

describe('ShadowDOMManipulator', () => {
    it('should replace image source and undo the replacement', () => {
        const shadowHost = document.createElement('div');
        shadowHost.id = 'my-shadow-root';
        document.body.appendChild(shadowHost);

        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = '<img src="https://example.com/old.jpg" alt="Old Image 1">';

        const mockUUIDGenerator = {
            generate: () => 'mocksi-1234'
        } as UUIDGenerator;

        const manipulator = new ShadowDOMManipulator(shadowRoot, mockUUIDGenerator);

        manipulator.replaceImage('https://example.com/old.jpg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=');
        expect(shadowRoot.innerHTML).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=');
        expect(shadowRoot.innerHTML).toContain('mocksi-1234');

        manipulator.undo();
        expect(shadowRoot.innerHTML).toContain('https://example.com/old.jpg');
    });
});