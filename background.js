chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_URL") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
              sendResponse({ error: chrome.runtime.lastError.message });
          } else if (tabs.length === 0) {
              sendResponse({ error: "No active tab found." });
          } else {
              sendResponse({ url: tabs[0].url });
          }
      });
      return true;
  }
});