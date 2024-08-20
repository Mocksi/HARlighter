# Reactor

Reactor is a TypeScript library designed to make it easy to modify HTML content based on user commands. It provides a streamlined way to implement changes on a webpage—like replacing text, adding elements, swapping images, and more—using a declarative approach that simplifies the process for both developers and AI systems.

## What is Reactor?

Reactor allows you to make dynamic updates to a webpage by specifying changes using CSS selectors and predefined actions. This makes it easier and safer to modify webpage content without writing complex code. For example, with Reactor, you can:

- Change someone's name everywhere it appears
- Add a new message at the top of the page
- Swap out an image for a different one
- Highlight specific words or sections
- Display a notification message

By abstracting these operations, Reactor helps maintain the integrity of the page's structure while enabling flexible, targeted updates.

## Usage

Follow these steps to use Reactor in your project:

Sure, I'll create detailed usage instructions for the `Reactor` class based on `reactor.ts` and the provided example.

## Usage Instructions for Reactor

Reactor is a powerful tool for dynamically modifying HTML content on a webpage. Below are the steps to use the `Reactor` class effectively.

### Step 1: Import the Reactor Class

First, import the `Reactor` class from the `reactor` module.

```typescript
import { Reactor } from 'reactor';
```

### Step 2: Create an Instance of Reactor

Create a new instance of the `Reactor` class.

```typescript
const exampleReactor = new Reactor();
```

### Step 3: Attach Reactor to the Document

Attach the `Reactor` instance to the document you want to modify. This step is necessary for the `Reactor` to start generating events and applying modifications.

```typescript
await exampleReactor.attach(document, highlighter);
```

- `document`: The HTML document to which the `Reactor` should be attached.
- `highlighter`: An instance of the `Highlighter` class used for highlighting elements (optional).

### Step 4: Define Modifications

Define the modifications you want to apply. Each modification should include:

- `selector`: A CSS selector to identify the element(s) to modify.
- `action`: The type of modification (e.g., replace, append, remove).
- Additional fields depending on the action (e.g., `content` for replacing text).

```typescript
const data = [
  { selector: "#user-info", action: "replace", content: "Santiago Hart" },
  { selector: "#welcome-message", action: "replace", content: "Welcome, Santiago!" },
  { selector: "#profile-pic", action: "swapImage", imageUrl: "santiago.jpg" },
  { selector: "body", action: "toast", toastMessage: "Welcome to the new site!" }
];
```

### Step 5: Push Modifications

Push the modifications to the `Reactor` instance. This will apply the modifications to the document.

```typescript
await exampleReactor.pushModification(data);
```

### Step 6: Export the Modified DOM

Export the modified DOM as an array of `DomJsonExportNode` objects. This can be useful for saving the modified state or further processing.

```typescript
const updatedDomJson = exampleReactor.exportDOM();
console.log(updatedDomJson);
```

### Example

Here is a complete example that demonstrates how to use the `Reactor` class:

```typescript
import { Reactor } from 'reactor';

// Step 1: Create an instance of Reactor
const exampleReactor = new Reactor();

// Step 2: Attach Reactor to the document
await exampleReactor.attach(document, highlighter);

// Step 3: Define modifications
const data = [
  { selector: "#user-info", action: "replace", content: "Santiago Hart" },
  { selector: "#welcome-message", action: "replace", content: "Welcome, Santiago!" },
  { selector: "#profile-pic", action: "swapImage", imageUrl: "santiago.jpg" },
  { selector: "body", action: "toast", toastMessage: "Welcome to the new site!" }
];

// Step 4: Push modifications
await exampleReactor.pushModification(data);

// Step 5: Export the modified DOM
const updatedDomJson = exampleReactor.exportDOM();
console.log(updatedDomJson);
```

### Additional Methods

- **detach(clearModifications = true)**: Detach the `Reactor` from the document, optionally clearing all applied modifications.
- **isAttached()**: Check if the `Reactor` is currently attached to a document.
- **getAppliedModifications()**: Get an iterable object of all applied modifications.
- **clearAppliedModifications()**: Clear all applied modifications.

By following these steps, you can effectively use the `Reactor` class to dynamically modify HTML content on a webpage.

## Supported Actions

Reactor supports several actions for modifying HTML content:

| Action      | Description                                           | Required Fields                       |
|-------------|-------------------------------------------------------|---------------------------------------|
| replace     | Replace the content of selected element(s)            | `content`                             |
| append      | Add content to the end of selected element(s)         | `content`                             |
| prepend     | Add content to the start of selected element(s)       | `content`                             |
| remove      | Remove selected element(s) from the HTML              | -                                     |
| swapImage   | Change the `src` URL of selected `<img>` element(s)   | `imageUrl`                            |
| highlight   | Apply a highlight effect to selected element(s)       | `highlightStyle` (optional)           |
| toast       | Show a notification message                           | `toastMessage`, `duration` (optional) |
| addComponent| Insert a custom component                             | `componentHtml`                       |
| replaceAll  | Replace all occurrences of a pattern in the content   | `content` (pattern to replace)        |
| unknown     | Reserved for future use or custom actions             | -                                     |

## Handling Errors

If something goes wrong during the HTML modification (e.g., an invalid CSS selector), Reactor will throw an error. Ensure your `modifyHtml` call is wrapped in a try/catch block:

```typescript
try {
  const updatedHtml = await modifyHtml(myHtml, userRequest);
  console.log(updatedHtml);
} catch (error) {
  console.error("Modification failed:", error);  
}
```

## Learning Resources

For more information on the technologies used by Reactor, check out these resources:

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [CSS Selectors Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Asynchronous Programming with async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await)

## Conclusion

Reactor offers a powerful and flexible way to modify webpages based on user input. It’s ideal for creating dynamic, personalized experiences in web apps, extensions, and more. By abstracting away the complexities of DOM manipulation, Reactor allows even beginner developers to focus on defining the changes they want to make rather than on how to implement them.

Try Reactor in your next project and see how it can simplify and enhance your web development process! If you have questions or feedback, feel free to open an issue on the library’s GitHub repository.

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
- `"replaceAll"`: Replaces all occurrences of a pattern in the content.
- `"unknown"`: Reserved for future use or custom actions.

## Examples

### Replace Text Content

**Before:**

```html
<div id="user-info">
  <span id="user-name">Jane Smith</span>
  <span id="user-email">jane.smith@example.com</span>
</div>
```

**Modification Request:**

```json
{
  "description": "Replace the user's name.",
  "modifications": [
    {
      "selector": "#user-name",
      "action": "replace",
      "content": "John Doe"
    }
  ]
}
```

**After:**

```html
<div id="user-info">
  <span id="user-name">John Doe</span>
  <span id="user-email">jane.smith@example.com</span>
</div>
```

### Swap Image Source

**Before:**

```html
<div class="profile">
  <img id="profile-pic" src="old-profile.jpg" alt="User profile picture">
  <p>Welcome back, user!</p>
</div>
```

**Modification Request:**

```json 
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

**After:**

```html
<div class="profile">
  <img id="profile-pic" src="new-profile.jpg" alt="User profile picture">
  <p>Welcome back, user!</p>
</div>
```
