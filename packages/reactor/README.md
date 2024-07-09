# Reactor

A TypeScript library for modifying HTML content based on specific user commands. This library supports various actions such as replacing text, appending content, swapping images, highlighting elements, creating toast alerts, and adding components using TailwindCSS and DaisyUI.

## Features

- Asynchronous HTML modification
- Support for multiple DOM operations:
  - Replace content
  - Append content
  - Prepend content
  - Remove elements
  - Swap images
  - Highlight elements
  - Create toast notifications
  - Add components (e.g., DaisyUI components)
- Error handling for missing elements
- Customizable delay between modifications

## Installation

```bash
 pnpm install html-modification-library
```

## Usage

```typescript
import { modifyHtml } from 'html-modification-library';

const html = `

<div id="user-info">Eliza Hart</div> <div id="welcome-message">Welcome, Eliza!</div> <img id="profile-pic" src="eliza.jpg" /> `;
const userRequest = JSON.stringify({ description: "Change all occurrences of the name 'Eliza' to 'Santiago', swap profile picture, and add a toast notification.", modifications: [ { selector: "#user-info", action: "replace", content: "Santiago Hart" }, { selector: "#welcome-message", action: "replace", content: "Welcome, Santiago!" }, { selector: "#profile-pic", action: "swapImage", imageUrl: "santiago.jpg" }, { selector: "body", action: "toast", toastMessage: "Welcome to the new site, Santiago!" } ] });

async function modifyMyHtml() { const modifiedHtml = await modifyHtml(html, userRequest); console.log(modifiedHtml); }

modifyMyHtml();
```


## API

### `modifyHtml(htmlString: string, userRequest: string): Promise<string>`

Modifies the given HTML string based on the user request and returns the modified HTML.

- `htmlString`: The original HTML string to be modified.
- `userRequest`: A JSON string containing the modification instructions.

Returns a Promise that resolves to the modified HTML string.

## Modification Request Format

The user request should be a JSON string with the following structure:

```json 
{
  "description": "A description of the modifications",
  "modifications": [
    {
      "selector": "CSS selector",
      "action": "action type",
      "content": "content to be added/replaced (optional)",
      "imageUrl": "URL for image swap (optional)",
      "toastMessage": "Message for toast notification (optional)",
      "componentHtml": "HTML for adding a component (optional)",
      "highlightStyle": "Style for highlighting (optional)"
    }
  ]
}
```
