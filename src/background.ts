chrome.runtime.onInstalled.addListener(() => {
  // Add context menu item
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize Text",
    contexts: ["selection"],
  });

  // Add keyboard shortcut listener
  chrome.commands.onCommand.addListener((command) => {
    if (command === "summarize-text") {
      const message = { action: "summarize" };
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(tabs[0].id, message);
      });
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
  });
});
