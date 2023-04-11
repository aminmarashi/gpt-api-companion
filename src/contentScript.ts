import gptApiClient from "./apiClient";
import { safeGetSelectedText } from "./utils";
const messages: Message[] = []

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "summarize") {
    const selectedText = safeGetSelectedText();
    if (selectedText) {
      // Fetch the stored API token
      chrome.storage.sync.get("apiToken", async ({ apiToken }) => {
        if (apiToken) {
          // Update the authorization header
          gptApiClient.setApiKey(apiToken);

          messages.push({
            system: 'you are a summerizer bot'
          });
          messages.push({
            user: selectedText
          });
          const summary = await gptApiClient.chat(messages);
          messages.push({
            assistant: summary
          });
          alert(`Summary: ${summary}`);
        } else {
          alert("Please set your GPT API Token in the extension settings.");
        }
      });
    } else {
      alert("Please select some text to summarize.");
    }
  }
});