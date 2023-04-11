import gptApiClient from "./apiClient";
import { sendMessageToContentScript } from "./utils";

const chat: Message[] = [];
document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form") as HTMLFormElement;
  const inputField = document.getElementById("input-field") as HTMLInputElement;
  const chatArea = document.getElementById("chat-area") as HTMLDivElement;

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userInput = inputField.value.trim();
    if (userInput) {
      chatArea.innerHTML += `<p class="user-message">${userInput}</p>`;
      inputField.value = "";

      // Fetch the stored API token
      chrome.storage.sync.get("apiToken", async ({ apiToken }) => {
        if (apiToken) {
          // Update the authorization header
          gptApiClient.setApiKey(apiToken);

          chat.push({
            user: userInput,
          })
          const response = await gptApiClient.chat(chat);
          chat.push({
            assistant: response
          })
          chatArea.innerHTML += `<p class="bot-message">${response}</p>`;
        } else {
          alert("Please set your GPT API Token in the extension settings.");
        }
      });
    }
  });

  // Add listener to initiate text summarization from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
      sendMessageToContentScript({ action: "summarize" });
    }
  });
});
