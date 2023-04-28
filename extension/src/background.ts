chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  try {
    const storage = await chrome.storage.sync.get('apiToken');
    if (!storage.apiToken) {
      getToken();
    }
    const updatedStorage = await chrome.storage.sync.get('apiToken');
    if (!updatedStorage.apiToken) {
      return;
    }
    if (!tab || !tab.id) {
      console.log('This extension only works on web pages.');
      return;
    }
    if (info.menuItemId === 'summarize-page') {
      await chrome.tabs.sendMessage(tab.id, { action: "summarize-page" });
    } else if (info.menuItemId === 'summarize-text') {
      await chrome.tabs.sendMessage(tab.id, { action: "summarize-text" });
    }
  } catch (e) {
    console.log(e);
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://chat.lit.codes' });
});

chrome.runtime.onInstalled.addListener(async () => {
  // Add context menu item
  chrome.contextMenus.create({
    id: "summarize-text",
    title: "Summarize Text",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "summarize-page",
    title: "Summarize Page",
    contexts: ["all"],
  });

  try {
    chrome.storage.sync.remove('apiToken');
    const storage = await chrome.storage.sync.get('apiToken');
    if (!storage.apiToken) {
      getToken();
    }
  } catch (e) {
    console.log(e);
  }
});

function saveToken() {
  const apiToken = localStorage.getItem('apiToken');
  if (apiToken) {
    chrome.storage.sync.set({ apiToken });
  } else {
    console.log('Please set your API Token in the extension options.')
  }
}

async function getToken() {
  chrome.tabs.create({
    active: true,
    url: 'https://chat.lit.codes/options'
  }, function (tab) {
    if (!tab.id) {
      console.log('Tab not found.');
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: saveToken,
    }, async function () {
      if (!tab.id) {
        console.log('Tab not found.');
        return;
      }
      const storage = await chrome.storage.sync.get('apiToken');
      if (storage.apiToken) {
        chrome.tabs.remove(tab.id);
      } else {
        console.log('Please set your API Token in the extension options.')
      }
    });
  });
}