import { sendMessageToContentScript } from "./utils";

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
      sendMessageToContentScript({ action: "summarize" });
    }
  });
});
