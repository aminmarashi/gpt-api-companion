import { renderMarkdown } from './markdown';
import gptApiClient from './apiClient';
import { Chat } from './Chat';
import { getApiToken } from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const optionsForm = document.getElementById('optionsForm') as HTMLFormElement;
  const apiTokenInput = document.getElementById('apiToken') as HTMLInputElement;
  const chatForm = document.getElementById('chatForm') as HTMLFormElement;
  const userInput = document.getElementById('userInput') as HTMLTextAreaElement;
  const chatElement = document.getElementById('chat') as HTMLDivElement;
  const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

  const chat = new Chat(chatElement);
  chrome.storage.sync.get('apiToken', ({ apiToken }) => {
    apiTokenInput.value = apiToken || '';
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  optionsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiToken = apiTokenInput.value.trim();
    if (apiToken) {
      chrome.storage.sync.set({ apiToken }, () => {
        alert('GPT API Token saved.');
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
        try {
          const response = await gptApiClient.chat(chat.getMessages());
          await chat.appendMessage('assistant', response);
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
