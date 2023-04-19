import { renderMarkdown } from './common/markdown';
import gptApiClient from './common/apiClient';
import { Chat } from './common/Chat';
import { getApiToken } from './utils';
import { Model } from './common/types';

document.addEventListener('DOMContentLoaded', () => {
  const optionsForm = document.getElementById('optionsForm') as HTMLFormElement;
  const apiTokenInput = document.getElementById('apiToken') as HTMLInputElement;
  const chatForm = document.getElementById('chatForm') as HTMLFormElement;
  const userInput = document.getElementById('userInput') as HTMLTextAreaElement;
  const chatElement = document.getElementById('chat') as HTMLDivElement;
  const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
  const modelSelect = document.getElementById('model') as HTMLSelectElement;
  const summerizerModelSelect = document.getElementById('summerizerModel') as HTMLSelectElement;
  const spinner = document.getElementById('spinner') as HTMLDivElement;

  const chat = new Chat(chatElement);
  chrome.storage.sync.get('apiToken', ({ apiToken }) => {
    apiTokenInput.value = apiToken || '';
  });

  chrome.storage.sync.get('summerizerModel', ({ summerizerModel }) => {
    if (summerizerModel) {
      summerizerModelSelect.value = summerizerModel;
    }
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  optionsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiToken = apiTokenInput.value.trim();
    const summerizerModel = summerizerModelSelect.value || 'gpt-3.5-turbo';
    chrome.storage.sync.set({ summerizerModel })

    if (apiToken) {
      chrome.storage.sync.set({ apiToken }, () => {
        alert('Options are successfully saved.');
      });
    } else {
      alert('Please enter a valid GPT API Token.');
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();

    if (message) {
      await chat.appendMessage('user', message);
      userInput.value = '';

      const apiToken = await getApiToken();

      if (apiToken) {
        gptApiClient.setApiKey(apiToken);
        if (modelSelect.value) {
          const model = modelSelect.value === 'gpt-4' ? Model.GPT4 : Model.GPT3_5_TURBO;
          gptApiClient.setModel(model);
        }
        try {
          spinner.classList.remove('hidden');
          const response = await gptApiClient.chat(chat.getMessages());
          await chat.appendMessage('assistant', response);
          spinner.classList.add('hidden');
          errorMessage.classList.add('hidden')
        } catch (err) {
          console.error(err);
          errorMessage.innerText = 'Something went wrong. Please try again.';
          errorMessage.classList.remove('hidden')
        }
      } else {
        alert('Please set your GPT API Token in the extension settings.');
      }
    }

  });

});
