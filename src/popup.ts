import gptApiClient from "./apiClient";
import { sendMessageToContentScript } from "./utils";

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

      const response = await gptApiClient.chat(userInput);
      chatArea.innerHTML += `<p class="bot-message">${response}</p>`;
    }
  });

  // Add listener to initiate text summarization from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
      sendMessageToContentScript({ action: "summarize" });
    }
  });

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

          const response = await gptApiClient.chat(userInput);
          chatArea.innerHTML += `<p class="bot-message">${response}</p>`;
        } else {
          alert("Please set your GPT API Token in the extension settings.");
        }
      });
    }
  });
});
