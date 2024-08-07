# Mocksi Lite

This is a Chrome extension to interact with the Mocksi API. It allows you to create engaging demos and prototypes by not just mocking, but also simulating
your frontend and API interactions.


## Tooling
This is a monorepo project built with [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io).


## Installation

## What's inside
* `apps/mocksi-lite` - Chrome extension
* `packages/reactor` - Internal package to interact with the Mocksi Mods DSL


### Development

To start developing the Chrome extension, you need to install the dependencies and start the development server.

1. Install [pnpm](https://pnpm.io/installation) globally.
2. Run `pnpm install` to install the dependencies.
3. Run `pnpm dev` to start the chrome extension test browser.


### Manual Release
1. Install [pnpm](https://pnpm.io/installation) globally.
2. Run `pnpm install` to install the dependencies.
3. Run `pnpm zip` to get a zip with your latest local changes.


### Linting
We use Biome for linting. To run the linter, run `pnpm lint`, or `pnpm format` to format the code.

### Contributing

We welcome contributions to the HARHighlighter project. If you have suggestions or improvements, please open an issue or submit a pull request.

### Support

For support or to report a bug, please open an issue on the GitHub repository.

### License
This project is licensed under the GNU General Public License v3.0 (GPLv3).

Key points of the GPLv3:

* Source code must be made available when the software is distributed.
* Modifications and derivative works must also be licensed under GPLv3.
* Provides explicit patent protection.
* Includes measures against hardware restrictions that prevent modified versions from running.
* Ensures compatibility with other open-source licenses.

For the full license text, see the LICENSE file in the root of this repository or visit GNU GPLv3.