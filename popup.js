// Dead Man's Tab - Popup Script
// This script handles the popup interface interactions

let isActive = false;
let selectedKey = 'Space'; // Default key

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const activateBtn = document.getElementById('activateBtn');
const deactivateBtn = document.getElementById('deactivateBtn');
const keySelect = document.getElementById('keySelect');
const currentKey = document.getElementById('currentKey');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkStatus();
  setupEventListeners();
});

function setupEventListeners() {
  activateBtn.addEventListener('click', activate);
  deactivateBtn.addEventListener('click', deactivate);
  keySelect.addEventListener('change', updateSelectedKey);
}

function loadSettings() {
  // Load saved key preference
  chrome.storage.sync.get(['deadMansKey'], (result) => {
    if (result.deadMansKey) {
      selectedKey = result.deadMansKey;
      keySelect.value = selectedKey;
      updateCurrentKeyDisplay();
    }
  });
}

function updateSelectedKey() {
  selectedKey = keySelect.value;
  updateCurrentKeyDisplay();
  
  // Save the preference
  chrome.storage.sync.set({deadMansKey: selectedKey});
  
  // If active, update the content script with the new key
  if (isActive) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateKey',
          key: selectedKey
        });
      }
    });
  }
}

function updateCurrentKeyDisplay() {
  const keyName = keySelect.options[keySelect.selectedIndex].text;
  currentKey.textContent = `Current: ${keyName}`;
}

function checkStatus() {
  chrome.runtime.sendMessage({action: 'getStatus'}, (response) => {
    if (response && response.status === 'active') {
      setActive(true);
    } else {
      setActive(false);
    }
  });
}

function activate() {
  // Send message to content script to activate with selected key
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'activate',
        key: selectedKey
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not send message to tab:', chrome.runtime.lastError);
          // Try to inject the script if it's not already there
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, () => {
            // Try again after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'activate',
                key: selectedKey
              });
            }, 100);
          });
        }
      });
    }
  });
  
  // Update background script status
  chrome.runtime.sendMessage({action: 'setStatus', status: 'active'});
  setActive(true);
}

function deactivate() {
  // Send message to content script to deactivate
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'deactivate'});
    }
  });
  
  // Update background script status
  chrome.runtime.sendMessage({action: 'setStatus', status: 'inactive'});
  setActive(false);
}

function setActive(active) {
  isActive = active;
  
  if (active) {
    statusIndicator.className = 'status-indicator active';
    statusText.textContent = 'ACTIVE - Hold a key!';
    activateBtn.style.display = 'none';
    deactivateBtn.style.display = 'block';
  } else {
    statusIndicator.className = 'status-indicator inactive';
    statusText.textContent = 'Inactive';
    activateBtn.style.display = 'block';
    deactivateBtn.style.display = 'none';
  }
}
