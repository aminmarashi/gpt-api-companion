# Chat with OpenAI API

Chat with OpenAI API is a Chrome extension that enhances your experience with the OpenAI GPT API. With this extension, you can interact with the OpenAI GPT API directly from your browser, summarize selected text, and even summarize entire web pages.

[Link to the extension](https://chromewebstore.google.com/detail/gpt-api-companion/bdaanmhmamgpeppfdajedeliilghopol)

## Features

1. Chat with the OpenAI GPT API in a separate Chrome tab.
2. Select text on any web page and send it to a customizable prompt via the context menu (right-click).
3. Read and summarize entire web pages.

## Installation

To install the Chat with OpenAI API extension, follow these steps:

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

    0. Run `yarn bundle` to create an extension bundle, then unzip the bundle
    1. Open the Extension Management page by navigating to `chrome://extensions`.
    2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
    3. Click the LOAD UNPACKED button and select the `pack` directory that you extracted from the bundle.

## Usage

1. Click on the Chat with OpenAI API icon in the Chrome toolbar to open the chat interface.
2. Go to the extension settings by right-clicking the Chat with OpenAI API icon and selecting "Options" to set your OpenAI GPT API Token.
3. To summarize selected text, select the text on any web page, right-click, and choose "Summarize with Chat with OpenAI API".

## Technologies

- TypeScript
- HTML
- Tailwind CSS
- Chrome Extension APIs

## License

[MIT](LICENSE)

