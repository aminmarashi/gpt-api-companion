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

  chrome.contextMenus.onClicked.addListener(async function (info, tab) {
    const storage = await chrome.storage.sync.get('apiToken');
    if (!storage.apiToken) {
      getToken();
    }
    const updatedStorage = await chrome.storage.sync.get('apiToken');
    if (!updatedStorage.apiToken) {
      return;
    }
    if (!tab || !tab.id) {
      alert('This extension only works on web pages.');
      return;
    }
    if (info.menuItemId === 'summarize-page') {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "summarize-page" }, function (response) { });
      });
    } else if (info.menuItemId === 'summarize-text') {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "summarize-text" }, function (response) { });
      });
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'https://chat.lit.codes' });
  });

  chrome.storage.sync.remove('apiToken');
  const storage = await chrome.storage.sync.get('apiToken');
  if (!storage.apiToken) {
    getToken();
  }
});

function saveToken() {
  const apiToken = localStorage.getItem('apiToken');
  if (apiToken) {
    chrome.storage.sync.set({ apiToken });
  } else {
    alert('Please set your API Token in the extension options.')
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