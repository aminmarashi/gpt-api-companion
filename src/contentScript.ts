import { Chat } from "./Chat";
import gptApiClient from "./apiClient";
import { getApiToken, safeGetSelectedText } from "./utils";

console.log('loaded')
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  let summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
  if (!summary) {
    createSummaryWindow();
  }
  summary = document.getElementById('--gpt-api-companion-summary') as HTMLDivElement
  const apiToken = await getApiToken();
  const chat = new Chat(summary);

  if (apiToken) {
    gptApiClient.setApiKey(apiToken);
    try {
      let text = '';
      if (message.action === 'summerize-page') {
        text = document.body.innerText;
      } else {
        text = safeGetSelectedText();
      }
      chat.appendMessage('system', 'You are a summarizer bot that summerizes anything that comes next');
      chat.appendMessage('user', text, true);
      const response = await gptApiClient.chat(chat.getMessages());
      chat.appendMessage('assistant', response);
    } catch (err) {
      console.error(err);
    }
  } else {
    alert('Please set your GPT API Token in the extension settings.');
  }

  // Attach question input event listener
  const questionInput = document.getElementById('--gpt-api-companion-question') as HTMLInputElement;
  questionInput?.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Add GPT API call to process the question and display the response
      const question = questionInput.value.trim();
      if (question) {
        chat.appendMessage('user', question);
        questionInput.value = '';
        const response = await gptApiClient.chat(chat.getMessages());
        chat.appendMessage('assistant', response);
      }
    }
  });

  function createSummaryWindow() {
    const windowWrapper = document.createElement('div');
    windowWrapper.id = '--gpt-api-companion-summary-window';
    windowWrapper.innerHTML = `
    <div style="position: absolute; top: 0; background-color: white; color: black; z-index: 10000;" draggable="true">
      <button id="--gpt-api-companion-window-close" style="border: none; background-color: transparent; cursor: pointer; font-size: 18px;">x</button>
      <h3>Page Summary</h3>
      <div id="--gpt-api-companion-summary" style="margin-bottom: 1rem;">
        <!-- Summary will be displayed here -->
      </div>
      <label for="gpt-summary-question" style="display: block; margin-bottom: .5rem;">Ask a question:</label>
      <input type="text" id="--gpt-api-companion--question" style="width: 100%; padding: .5rem; border: 1px solid #ccc;" />
    </div>
  `;
    document.body.appendChild(windowWrapper);

    // Attach close button event listener
    const closeButton = document.getElementById('--gpt-api-companion-window-close');
    closeButton?.addEventListener('click', () => {
      windowWrapper.remove();
    });
  }
});