# GPT API Companion

GPT API Companion is a Chrome extension that enhances your experience with the GPT API. With this extension, you can interact with the GPT API directly from your browser, summarize selected text, and even summarize entire web pages.

## Features

1. Chat with the GPT API in a popup window or a separate Chrome tab.
2. Select text on any web page and send it to a customizable prompt via the context menu (right-click) or a keyboard shortcut (Alt+G by default).
3. Read and summarize entire web pages.

## Installation

To install the GPT API Companion extension, follow these steps:

1. Clone this repository to your local machine:

```bash
git clone https://github.com/aminmarashi/gpt-api-companion.git
```

2. Install the required dependencies:

```bash
yarn install
```

3. Compile the TypeScript files:

```bash
yarn build
```

4. Load the extension in Google Chrome:

    1. Open the Extension Management page by navigating to `chrome://extensions`.
    2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
    3. Click the LOAD UNPACKED button and select the `dist` directory.

## Usage

1. Click on the GPT API Companion icon in the Chrome toolbar to open the chat interface.
2. Go to the extension settings by right-clicking the GPT API Companion icon and selecting "Options" to set your GPT API Token.
3. To summarize selected text, select the text on any web page, right-click, and choose "Summarize with GPT API Companion" or use the keyboard shortcut (Alt+G by default).

## Technologies

- TypeScript
- HTML
- Tailwind CSS
- Chrome Extension APIs

## License

[MIT](LICENSE)

