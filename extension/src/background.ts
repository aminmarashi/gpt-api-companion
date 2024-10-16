import { Model } from "./common/types";

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  try {
    const storage = await chrome.storage.sync.get("apiToken");
    if (!storage.apiToken) {
      getOptions();
    }
    const updatedStorage = await chrome.storage.sync.get("apiToken");
    if (!updatedStorage.apiToken) {
      return;
    }
    if (!tab || !tab.id) {
      console.log("This extension only works on web pages.");
      return;
    }
    if (info.menuItemId === "lit-chat") {
      chrome.tabs.create({ url: "https://chat.lit.codes" });
    } else {
      await chrome.tabs.sendMessage(tab.id, { action: "summarize-text" });
    }
  } catch (e) {
    console.log(e);
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    const storage = await chrome.storage.sync.get("apiToken");
    if (!storage.apiToken) {
      getOptions();
    }
    const updatedStorage = await chrome.storage.sync.get("apiToken");
    if (!updatedStorage.apiToken) {
      return;
    }
    if (!tab || !tab.id) {
      console.log("This extension only works on web pages.");
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { action: "summarize-page" });
  } catch (e) {
    console.log(e);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  // Add context menu item
  chrome.contextMenus.create({
    id: "summarize-text",
    title: "Summarize Text",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "lit-chat",
    title: "Chat with GPT API",
    contexts: ["all"],
  });

  try {
    chrome.storage.sync.remove("apiToken");
    const storage = await chrome.storage.sync.get("apiToken");
    if (!storage.apiToken) {
      getOptions();
    }
  } catch (e) {
    console.log(e);
  }
});

function saveOptions() {
  const apiToken = localStorage.getItem("apiToken");
  if (apiToken) {
    chrome.storage.sync.set({ apiToken });
  } else {
    console.log("Please set your API Token in the extension options.");
  }

  const defaultModel = localStorage.getItem("defaultModel");
  if (defaultModel) {
    chrome.storage.sync.set({ defaultModel });
  } else {
    chrome.storage.sync.set({ defaultModel: Model.GPT_4O });
  }
}

async function getOptions() {
  chrome.tabs.create(
    {
      active: true,
      url: "https://chat.lit.codes/options",
    },
    function (tab) {
      if (!tab.id) {
        console.log("Tab not found.");
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: saveOptions,
        },
        async function () {
          if (!tab.id) {
            console.log("Tab not found.");
            return;
          }
          const storage = await chrome.storage.sync.get("apiToken");
          if (storage.apiToken) {
            chrome.tabs.remove(tab.id);
          } else {
            console.log("Please set your API Token in the extension options.");
          }
        }
      );
    }
  );
}
