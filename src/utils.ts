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
    chrome.storage.sync.get('apiToken', ({ apiToken }) => {
      resolve(apiToken);
    });
  });
}
