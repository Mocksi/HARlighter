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

In this section, we'll walk through a practical example of how to use the Reactor library to modify HTML content based on user requests. This example will cover obtaining the HTML content to be modified, processing the user request, and handling potential errors.

Prerequisites
Before proceeding, ensure you have installed the html-modification-library by running:

`pnpm install html-modification-library`

### Step 1: Obtaining the HTML Content
First, you need to obtain the HTML content you wish to modify. This could be from a local file, fetched from a server, or dynamically generated within your application. For demonstration purposes, let's assume you have the following HTML content stored in a variable named htmlContent:

```typescript
const htmlContent = `
<div id="user-info">Eliza Hart</div>
<div id="welcome-message">Welcome, Eliza!</div>
<img id="profile-pic" src="eliza.jpg" />
`;
```

### Step 2: Defining User Modifications
Next, define the modifications you want to apply to the HTML content. These modifications are specified as an array of objects, each describing a particular action to perform on the HTML content.

```typescript
import { modifyHtml } from 'html-modification-library';

const htmlModifications = [
  { selector: "#user-info", action: "replace", content: "Santiago Hart" },
  { selector: "#welcome-message", action: "replace", content: "Welcome, Santiago!" }, 
  { selector: "#profile-pic", action: "swapImage", imageUrl: "santiago.jpg" },
  { selector: "body", action: "toast", toastMessage: "Welcome to the new site, Santiago!" } 
];
```

### Step 3: Creating the User Request

Combine the description of the modifications and the modifications themselves into a single object. This object is then converted into a JSON string, which serves as the input for the modifyHtml function.

```typescript
const userRequest = JSON.stringify({
  description: "Change all occurrences of the name 'Eliza' to 'Santiago', swap profile picture, and add a toast notification.",
  modifications: htmlModifications
});
```

### Step 4: Modifying the HTML Content
Use the modifyHtml function to process the HTML content according to the user request. This function is asynchronous, so it must be awaited or handled with .then().

```typescript
async function modifyHtmlContent() {
  try {
    const modifiedHtml = await modifyHtml(htmlContent, userRequest);
    console.log(modifiedHtml);
  } catch (error) {
    console.error("Failed to modify HTML:", error);
  }
}

// Calling the function
modifyHtmlContent();
```


### Output:
```html
<div id="user-info">Santiago Hart</div>
<div id="welcome-message">Welcome, Santiago!</div>
<img id="profile-pic" src="santiago.jpg" />
<div class="toast">Welcome to the new site, Santiago!</div>
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
      "highlightStyle": "Style for highlighting (optional)",
      "delay": "Delay in milliseconds before applying the modification (optional)"
    }
  ]
}
```


### Actions

- `"replace"`: Replaces the content of the selected element(s).
- `"append"`: Appends new content to the end of the selected element(s).
- `"prepend"`: Prepends new content to the beginning of the selected element(s).
- `"remove"`: Removes the selected element(s) from the DOM.
- `"swapImage"`: Swaps the `src` attribute of an `<img>` tag with a new URL.
- `"highlight"`: Applies a custom style for highlighting the selected element(s).
- `"toast"`: Displays a toast notification with a specified message.
- `"addComponent"`: Adds a custom HTML component to the selected location.
- `"unknown"`: Reserved for future use or custom actions.

## Examples

#### Replace Text Content
##### Before
```html
<div id="user-info">
  <span id="user-name">Jane Smith</span>
  <span id="user-email">jane.smith@example.com</span>
</div>
```

##### Request
Replace the text content of an element identified by its ID.
```json
[{
  "description": "Replace the user's name.",
  "modifications": [
    {
      "selector": "#user-name",
      "action": "replace",
      "content": "John Doe"
    }
  ]
}]
```
##### After
```html
<div id="user-info">
  <span id="user-name">John Doe</span>
  <span id="user-email">jane.smith@example.com</span>
</div>
```

#### Swap Image Source
##### Before
```html
<div class="profile">
  <img id="profile-pic" src="old-profile.jpg" alt="User profile picture">
  <p>Welcome back, user!</p>
</div>
```
##### User Request
Swap the `src` attribute of an image element identified by its ID.

``` json 
{
  "description": "Swap the profile picture.",
  "modifications": [
    {
      "selector": "#profile-pic",
      "action": "swapImage",
      "imageUrl": "new-profile.jpg"
    }
  ]
}
```
##### After
```html
<div class="profile">
  <img id="profile-pic" src="new-profile.jpg" alt="User profile picture">
  <p>Welcome back, user!</p>
</div>
```


