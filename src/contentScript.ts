import gptApiClient from "./apiClient";
import { safeGetSelectedText } from "./utils";

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "summarize") {
    const selectedText = safeGetSelectedText();
    if (selectedText) {
      const summary = await gptApiClient.summarize(selectedText);
      alert(`Summary: ${summary}`);
    } else {
      alert("Please select some text to summarize.");
    }
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "summarize") {
    const selectedText = safeGetSelectedText();
    if (selectedText) {
      // Fetch the stored API token
      chrome.storage.sync.get("apiToken", async ({ apiToken }) => {
        if (apiToken) {
          // Update the authorization header
          gptApiClient.setApiKey(apiToken);

          const summary = await gptApiClient.summarize(selectedText);
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