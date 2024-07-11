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

## Contributing

Contributions to Mocksi Lumen are welcome! Please feel free to submit issues or propose enhancements through the project's repository.

## License

Mocksi Lumen is licensed under the GPLV3 License. See the `LICENSE` file for more details.
