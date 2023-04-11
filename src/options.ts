import { renderMarkdown } from './markdown';
import gptApiClient from './apiClient';

const chat: Message[] = []
document.addEventListener('DOMContentLoaded', () => {
  const optionsForm = document.getElementById('optionsForm') as HTMLFormElement;
  const apiTokenInput = document.getElementById('apiToken') as HTMLInputElement;
  const chatForm = document.getElementById('chatForm') as HTMLFormElement;
  const userInput = document.getElementById('userInput') as HTMLTextAreaElement;
  const chatHistory = document.getElementById('chatHistory');
  const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;

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
      await appendMessageToHistory('You', message);
      userInput.value = '';

      const apiToken = await getApiToken();

      if (apiToken) {
        gptApiClient.setApiKey(apiToken);
        try {
          chat.push({
            user: message
          })
          const response = await gptApiClient.chat(chat);
          chat.push({
            assistant: response
          })
          await appendMessageToHistory('GPT API Companion', response);
        } catch (err) {
          console.error(err);
          errorMessage.innerText = 'Something went wrong. Please try again.';
          errorMessage.classList.remove('hidden')
        }
      } else {
        alert('Please set your GPT API Token in the extension settings.');
      }
    }
    async function appendMessageToHistory(sender: string, message: string) {
      if (!chatHistory) {
        throw new Error('Chat history element not found.');
      }
      const messageElement = document.createElement('div');
      messageElement.className = 'my-2';
      messageElement.innerHTML = `<strong>${sender}:</strong> ${await renderMarkdown(message)}`;
      chatHistory.appendChild(messageElement);

      // Scroll chat history to the bottom
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }

  });

  async function getApiToken(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('apiToken', ({ apiToken }) => {
        resolve(apiToken);
      });
    });
  }
});
