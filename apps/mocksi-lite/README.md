# Mocksi Lite

Mocksi Lite is a Chrome extension designed to enhance the functionality of Mocksi, allowing users to create engaging demos and prototypes by mocking and simulating frontend and API interactions.

## Overview

Mocksi Lite leverages modern web technologies and best practices to provide a seamless experience for developers and testers. It includes a background script that manages various aspects of the extension, including data synchronization, request interception, and state management.

## Features

- **Dynamic Content Manipulation**: Utilizes React components to dynamically render and manage different states of the extension, such as recording, editing, and playing demos.
- **Request Interception**: Implements a sophisticated request interception mechanism to capture and modify network requests during recording and playback.
- **State Management**: Employs a robust state management system to handle different application states, including initialization, recording, editing, and playback.
- **Data Synchronization**: Implements methods to synchronize data between the extension and the server, ensuring consistency across environments.
- **DOM Manipulation**: Provides utilities for manipulating the DOM, including adding custom placeholders and modifying content.
- **Chrome Extension Best Practices**: Built using modern tools and libraries, including React for UI components and TypeScript for robust type safety and maintainability.

## Getting Started

To get started with Mocksi Lite, ensure you have Node.js and pnpm installed on your system. Then, clone the repository and navigate to the project directory. Install the dependencies by running:

```bash
pnpm install
```

### Running the Application

- **Development Mode**: To run the application in development mode, use the following command:

```bash
pnpm dev
```

- **Building the Extension**: To compile the extension for distribution, execute the build command:

```bash
pnpm build
```

- **Creating a ZIP file**: To create a ZIP file of the extension for distribution, run:

```bash
pnpm zip
```

## Contributing

Contributions to Mocksi Lite are welcome! Please feel free to submit issues or propose enhancements through the project's repository.

## License

Mocksi Lite is licensed under the GPLV3 License. See the `LICENSE` file for more details.