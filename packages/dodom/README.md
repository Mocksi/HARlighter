# DoDomCommander

DoDomCommander is a TypeScript package for command pattern-based DOM manipulation and network mock management. It supports shadow DOM operations, snapshotting, undo/redo functionality, and network mocking.

## Features

- Find nodes by selector
- Clone nodes with auto-generated UUIDs
- Replace text content
- Replace images with data URIs
- Wrap text with overlays
- Manage network mocks
- Snapshot the DOM state
- Undo/Redo operations
- Revert to specific snapshots

## Usage

### Replacing an Image with a Data URI

```typescript
import { ShadowDOMManipulator } from './receivers/ShadowDOMManipulator';
import { ReplaceImageCommand } from './commands/ReplaceImageCommand';

// Example of using the system
const shadowRoot = document.querySelector('#my-shadow-root')?.shadowRoot as ShadowRoot;
const shadowDOMManipulator = new ShadowDOMManipulator(shadowRoot);

console.log('Before replacement:', shadowRoot.innerHTML);
// Output:  <img src="https://example.com/old.jpg" alt="Old Image 1">


shadowDOMManipulator.replaceImage('https://example.com/old.jpg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=');

console.log('After replacement:', shadowRoot.innerHTML);
// <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...=" alt="Old Image 1" data-mocksi-id="mocksi-1245">

console.log(shadowDOMManipulator.modifiedNodes);
// Output: ["mocksi-1245"]

shadowDOMManipulator.undo();
 
 console.log('After undo:', shadowRoot.innerHTML);
// Output:  <img src="https://example.com/old.jpg" alt="Old Image 1">

```

