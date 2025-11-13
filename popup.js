// Dead Man's Tab - Popup Script
// This script handles the popup interface interactions

let isActive = false;
let selectedKey = null;
let isCapturingKey = false;
let captureTimer = null;
let currentKeys = new Set();

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const beginBtn = document.getElementById('beginBtn');
const deactivateBtn = document.getElementById('deactivateBtn');
const keyStatus = document.getElementById('keyStatus');
const keyCapture = document.getElementById('keyCapture');
const progressBar = document.getElementById('progressBar');
const captureTimerDisplay = document.getElementById('captureTimer');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkStatus();
  setupEventListeners();
});

function setupEventListeners() {
  beginBtn.addEventListener('click', handleBegin);
  deactivateBtn.addEventListener('click', deactivate);
  
  // Listen for key events to track current keypresses
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function loadSettings() {
  // Load saved key preference
  chrome.storage.sync.get(['deadMansKey'], (result) => {
    if (result.deadMansKey) {
      selectedKey = result.deadMansKey;
    }
  });
}

function handleKeyDown(event) {
  currentKeys.add(event.code);
  updateKeyStatus();
}

function handleKeyUp(event) {
  currentKeys.delete(event.code);
  updateKeyStatus();
  
  // If we're capturing and this was our captured key, complete the capture
  if (isCapturingKey && event.code === selectedKey) {
    completeKeyCapture();
  }
}

function updateKeyStatus() {
  if (currentKeys.size === 0) {
    keyStatus.textContent = 'None';
  } else if (currentKeys.size === 1) {
    const keyCode = Array.from(currentKeys)[0];
    keyStatus.textContent = getKeyDisplayName(keyCode);
  } else {
    keyStatus.textContent = 'Multiple';
  }
}

function handleBegin() {
  console.log('Dead Man\'s Tab: Begin button clicked, current keys:', Array.from(currentKeys));
  
  if (isActive) {
    // If already active, deactivate
    console.log('Dead Man\'s Tab: Deactivating (already active)');
    deactivate();
    return;
  }
  
  if (currentKeys.size === 1) {
    // One key is held down - set it as the dead man's key and activate immediately
    const keyCode = Array.from(currentKeys)[0];
    selectedKey = keyCode;
    console.log('Dead Man\'s Tab: One key detected, activating immediately with:', keyCode);
    saveKeyAndActivate();
  } else if (currentKeys.size === 0) {
    // No keys held - start capture mode
    console.log('Dead Man\'s Tab: No keys detected, starting capture mode');
    startKeyCapture();
  } else {
    // Multiple keys held - show prompt to hold just one
    console.log('Dead Man\'s Tab: Multiple keys detected, starting capture mode');
    startKeyCapture();
  }
}

function startKeyCapture() {
  isCapturingKey = true;
  beginBtn.disabled = true;
  beginBtn.textContent = 'Capturing...';
  keyCapture.style.display = 'block';
  
  // Reset progress
  progressBar.style.width = '0%';
  captureTimerDisplay.textContent = '3';
  
  // Start 3-second timer
  let timeLeft = 3;
  captureTimer = setInterval(() => {
    timeLeft--;
    captureTimerDisplay.textContent = timeLeft;
    progressBar.style.width = `${((3 - timeLeft) / 3) * 100}%`;
    
    if (timeLeft <= 0) {
      // Time's up, check if we have a key
      if (currentKeys.size === 1) {
        const keyCode = Array.from(currentKeys)[0];
        selectedKey = keyCode;
        completeKeyCapture();
      } else {
        cancelKeyCapture();
      }
    }
  }, 1000);
}

function completeKeyCapture() {
  if (!isCapturingKey) return;
  
  // Clear timer
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
  
  // Save the preference
  chrome.storage.sync.set({deadMansKey: selectedKey});
  
  // Update UI
  isCapturingKey = false;
  beginBtn.disabled = false;
  beginBtn.textContent = 'Begin';
  keyCapture.style.display = 'none';
  
  // Activate immediately
  saveKeyAndActivate();
}

function cancelKeyCapture() {
  if (!isCapturingKey) return;
  
  // Clear timer
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
  
  // Reset UI
  isCapturingKey = false;
  beginBtn.disabled = false;
  beginBtn.textContent = 'Begin';
  keyCapture.style.display = 'none';
}

function saveKeyAndActivate() {
  console.log('Dead Man\'s Tab: Saving key and activating:', selectedKey);
  
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
        } else {
          console.log('Dead Man\'s Tab: Successfully activated content script');
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
    statusText.textContent = 'ACTIVE - Hold your key!';
    beginBtn.style.display = 'none';
    deactivateBtn.style.display = 'block';
  } else {
    statusIndicator.className = 'status-indicator inactive';
    statusText.textContent = 'Inactive';
    beginBtn.style.display = 'block';
    deactivateBtn.style.display = 'none';
  }
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

function getKeyDisplayName(keyCode) {
  const keyNames = {
    'Space': 'Space',
    'Enter': 'Enter',
    'ShiftLeft': 'Left Shift',
    'ShiftRight': 'Right Shift',
    'ControlLeft': 'Left Ctrl',
    'ControlRight': 'Right Ctrl',
    'AltLeft': 'Left Alt',
    'AltRight': 'Right Alt',
    'Tab': 'Tab',
    'Escape': 'Escape',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'ArrowUp': '↑ Arrow Up',
    'ArrowDown': '↓ Arrow Down',
    'ArrowLeft': '← Arrow Left',
    'ArrowRight': '→ Arrow Right',
    'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
    'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
    'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
    'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
    'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y', 'KeyZ': 'Z'
  };
  return keyNames[keyCode] || keyCode;
}