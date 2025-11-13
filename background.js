// Dead Man's Tab - Background Script
// This script runs in the background and handles tab management

let isActive = false;

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'closeTab') {
    console.log('Dead Man\'s Tab: Background script received closeTab request');
    // Close the current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        console.log('Dead Man\'s Tab: Attempting to close tab ID:', tabs[0].id, 'URL:', tabs[0].url);
        chrome.tabs.remove(tabs[0].id, () => {
          if (chrome.runtime.lastError) {
            console.log('Dead Man\'s Tab: Error closing tab:', chrome.runtime.lastError);
          } else {
            console.log('Dead Man\'s Tab: Tab closed successfully');
          }
        });
      } else {
        console.log('Dead Man\'s Tab: No active tab found to close');
      }
    });
  } else if (request.action === 'openPopup') {
    console.log('Dead Man\'s Tab: Attempting to open popup');
    // Try to open the popup (requires user gesture, which we have from the click)
    chrome.action.openPopup((result) => {
      if (chrome.runtime.lastError) {
        console.log('Dead Man\'s Tab: Could not open popup:', chrome.runtime.lastError);
        sendResponse({success: false, error: chrome.runtime.lastError.message});
      } else {
        console.log('Dead Man\'s Tab: Popup opened successfully');
        sendResponse({success: true});
      }
    });
    return true; // Keep message channel open for async response
  } else if (request.action === 'getStatus') {
    sendResponse({status: isActive ? 'active' : 'inactive'});
  } else if (request.action === 'setStatus') {
    isActive = request.status === 'active';
    sendResponse({status: 'updated'});
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dead Man\'s Tab extension installed');
});
