chrome.runtime.onInstalled.addListener((opt) => {
  if (opt.reason === 'install') {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('welcome/index.html'),
    });
  } else if (opt.reason === 'update') {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('changelog/index.html'),
    });
  }
});
