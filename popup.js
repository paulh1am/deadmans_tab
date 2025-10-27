// Dead Man's Tab - Popup Script
// This script handles the popup interface interactions

let isActive = false;
let selectedKey = null; // No key set initially
let isCapturingKey = false;
let captureTimer = null;
let captureProgress = null;

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const activateBtn = document.getElementById('activateBtn');
const deactivateBtn = document.getElementById('deactivateBtn');
const setKeyBtn = document.getElementById('setKeyBtn');
const currentKey = document.getElementById('currentKey');
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
  activateBtn.addEventListener('click', activate);
  deactivateBtn.addEventListener('click', deactivate);
  setKeyBtn.addEventListener('click', startKeyCapture);
  
  // Listen for key events during capture
  document.addEventListener('keydown', handleKeyCapture);
  document.addEventListener('keyup', handleKeyRelease);
}

function loadSettings() {
  // Load saved key preference
  chrome.storage.sync.get(['deadMansKey'], (result) => {
    if (result.deadMansKey) {
      selectedKey = result.deadMansKey;
      updateCurrentKeyDisplay();
    }
  });
}

function startKeyCapture() {
  if (isCapturingKey) return;
  
  isCapturingKey = true;
  setKeyBtn.disabled = true;
  setKeyBtn.textContent = '🎯 CAPTURING...';
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
      // Time's up, but we need a key to be held
      if (selectedKey) {
        completeKeyCapture();
      } else {
        cancelKeyCapture();
      }
    }
  }, 1000);
}

function handleKeyCapture(event) {
  if (!isCapturingKey) return;
  
  // Prevent default to avoid interfering with the page
  event.preventDefault();
  event.stopPropagation();
  
  // Set the captured key
  selectedKey = event.code;
  updateCurrentKeyDisplay();
  
  // If Enter is pressed, complete immediately
  if (event.code === 'Enter') {
    completeKeyCapture();
  }
}

function handleKeyRelease(event) {
  if (!isCapturingKey) return;
  
  // If the released key is our captured key, complete the capture
  if (event.code === selectedKey) {
    completeKeyCapture();
  }
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
  setKeyBtn.disabled = false;
  setKeyBtn.textContent = '🎯 SET DEAD MAN\'S KEY';
  keyCapture.style.display = 'none';
  
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

function cancelKeyCapture() {
  if (!isCapturingKey) return;
  
  // Clear timer
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
  
  // Reset UI
  isCapturingKey = false;
  setKeyBtn.disabled = false;
  setKeyBtn.textContent = '🎯 SET DEAD MAN\'S KEY';
  keyCapture.style.display = 'none';
  
  // Reset key if no key was captured
  if (!selectedKey) {
    currentKey.textContent = 'No key set';
  }
}

function updateCurrentKeyDisplay() {
  if (selectedKey) {
    const keyName = getKeyDisplayName(selectedKey);
    currentKey.textContent = `Current: ${keyName}`;
  } else {
    currentKey.textContent = 'No key set';
  }
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
  // Check if a key is set
  if (!selectedKey) {
    alert('Please set a Dead Man\'s key first!');
    return;
  }
  
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
