// Dead Man's Tab - Background Script
// This script runs in the background and handles tab management

let isActive = false;

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'closeTab') {
    // Close the current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.remove(tabs[0].id);
      }
    });
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
