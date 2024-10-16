import { Model } from "./common/types";

export function sendMessageToContentScript(message: any) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) return;
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

export function safeGetSelectedText() {
  const selection = window.getSelection();
  if (selection) {
    return selection.toString();
  }
  return "";
}

export async function getApiToken(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("apiToken", ({ apiToken }) => {
      resolve(apiToken);
    });
  });
}

export async function getsummarizerModel(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("defaultModel", ({ summarizerModel }) => {
      resolve(summarizerModel);
    });
  });
}

export const limits = {
  [Model.GPT3_5_TURBO]: 16385,
  [Model.GPT4]: 8192,
  [Model.GPT4_TURBO]: 128000,
  [Model.GPT_4O]: 128000,
  [Model.GPT_4O_MINI]: 128000,
  [Model.O1_PREVIEW]: 128000,
  [Model.O1_MINI]: 128000,
};

export function getGPTModel(modelValue: Model): Model {
  for (const [key, value] of Object.entries(Model)) {
    if (value === modelValue) {
      return Model[key as keyof typeof Model];
    }
  }
  return Model.GPT_4O;
}
