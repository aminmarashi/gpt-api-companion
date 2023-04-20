chrome.runtime.onInstalled.addListener(() => {
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

  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (!tab || !tab.id) {
      alert('This extension only works on web pages.');
      return;
    }
    if (info.menuItemId === 'summarize-page') {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "summerize-page" }, function (response) { });
      });
    } else if (info.menuItemId === 'summarize-text') {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(tabs[0].id, { action: "summerize-text" }, function (response) { });
      });
    }
  });

  chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'https://chat.lit.codes' });
  });

  function saveToken() {
    const apiToken = localStorage.getItem('apiToken');
    const summerizerModel = localStorage.getItem('summerizerModel');
    if (apiToken) {
      chrome.storage.sync.set({ apiToken });
    }
    if (summerizerModel) {
      chrome.storage.sync.set({ summerizerModel });
    }
  }

  const apiToken = chrome.storage.sync.get('apiToken');
  if (!apiToken) {
    chrome.tabs.create({
      active: true,
      url: 'https://chat.lit.codes'
    }, function (tab) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: saveToken,
      }, function () {
        if (chrome.storage.sync.get('apiToken')) {
          chrome.tabs.remove(tab.id);
        } else {
          alert('Please set your API Token in the extension options.')
        }
      });
    });
  }

});