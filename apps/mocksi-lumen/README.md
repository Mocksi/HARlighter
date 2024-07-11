# Mocksi Lumen

Mocksi Lumen is a Chrome extension designed to enhance the functionality of Mocksi, allowing users to create engaging demos and prototypes by mocking and simulating frontend and API interactions. This project represents the revamped version of the original Mocksi Lite extension, offering improved performance and features.

## Overview

Mocksi Lumen leverages modern web technologies and best practices to provide a seamless experience for developers and testers. It includes a background script (`BackgroundSync`) that periodically synchronizes data between the client and server, ensuring that all interactions are accurately reflected across environments.

## Features

- **Periodic Data Synchronization**: Utilizes a background synchronization mechanism to keep data consistent between the client and server. This feature ensures that any changes made during testing or development are promptly synchronized, reducing the need for manual updates.
- **Offline Support**: The extension intelligently handles offline scenarios, attempting to synchronize data as soon as the device comes back online.
- **Chrome Extension Development Best Practices**: Built using modern tools and libraries, including React for UI components and TypeScript for robust type safety and maintainability.

## Getting Started

To get started with Mocksi Lumen, ensure you have Node.js installed on your system. Then, clone the repository and navigate to the project directory. Install the dependencies by running:

```bash
pnpm install
```

### Running the Application

- **Development Mode**: To run the application in development mode, use the following command. This will start the extension in a development environment, enabling hot reloading and other developer-friendly features.

```bash
pnpm run dev
```

- **Production Mode**: For testing the extension in a production-like environment, use the following command. This is useful for final checks before publishing the extension to the Chrome Web Store.

```bash
pnpm run start
```

- **Building the Extension**: To compile the extension for distribution, execute the build command. This will bundle the extension into a format suitable for deployment.

```bash
pnpm run build
```

## `BackgroundSync` and `ExtensionStorage`

The `BackgroundSync` and `ExtensionStorage` classes play crucial roles in managing data synchronization and storage within the Mocksi Lumen extension. These components are designed to facilitate seamless interaction between the client-side and server-side environments, ensuring data consistency and integrity.

### BackgroundSync

The `BackgroundSync` class is responsible for periodically synchronizing data between the client and server. It utilizes a background synchronization mechanism that keeps data consistent, ensuring that any changes made during testing or development are promptly synchronized. This reduces the need for manual updates and enhances the overall efficiency of the extension.

#### Key Methods:

- `start()`: Initiates the synchronization process. If the extension is not already synchronizing, it sets up an interval to call the `sync()` method every few minutes (default is 5 minutes). It also listens for the `online` event to trigger synchronization when the browser comes back online.
- `stop()`: Stops the ongoing synchronization process by clearing the interval set by `start()`.
- `sync()`: Attempts to synchronize data with the server. It checks if the browser is online before proceeding with the synchronization. If successful, it logs a success message; otherwise, it logs an error or skips the operation if the browser is offline.

### ExtensionStorage

The `ExtensionStorage` class manages the extension's data storage needs, providing methods to interact with the Chrome Storage API. It abstracts the complexities of direct API calls, offering a simplified interface for setting, getting, and updating storage items.

#### Key Methods:

- `setStorageItem(key: string, value: any)`: Sets a key-value pair in the extension's storage.
- `getStorageItem(key: string)`: Retrieves the value associated with a given key from the extension's storage.
- `addDomainVisited(domain: string)`: Adds a domain to the list of visited domains, storing it in the extension's storage.
- `getDomainsVisited()`: Retrieves the list of visited domains from the extension's storage.
- `addDemo(demo: any)`: Adds a demo object to the list of demos, storing it in the extension's storage.
- `getDemos()`: Retrieves the list of demos from the extension's storage.
- `updateDemo(updatedDemo: any)`: Updates an existing demo object in the list of demos, storing the updated object in the extension's storage.

### Testing

Both `BackgroundSync` and `ExtensionStorage` are thoroughly tested to ensure reliability and correctness. Unit tests cover their core functionalities, including starting and stopping synchronization, setting and getting storage items, adding and retrieving domains and demos, and handling sync queue operations. These tests mock the Chrome APIs and simulate various scenarios to validate the behavior of these components under different conditions.

By leveraging these components, Mocksi Lumen offers a robust solution for managing data synchronization and storage, facilitating a smoother development and testing experience for users.
## Contributing

Contributions to Mocksi Lumen are welcome! Please feel free to submit issues or propose enhancements through the project's repository.

## License

Mocksi Lumen is licensed under the GPLV3 License. See the `LICENSE` file for more details
