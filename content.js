// Dead Man's Tab - Content Script
// This script runs on every webpage and handles the key press/release logic

let isDeadMansTabActive = false;
let deadMansKey = 'Space'; // The key that will trigger tab closure
let isKeyHeld = false;
let keyPressStartTime = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activate') {
    deadMansKey = request.key || 'Space';
    activateDeadMansTab();
    sendResponse({status: 'activated'});
  } else if (request.action === 'deactivate') {
    deactivateDeadMansTab();
    sendResponse({status: 'deactivated'});
  } else if (request.action === 'updateKey') {
    deadMansKey = request.key;
    sendResponse({status: 'keyUpdated'});
  } else if (request.action === 'getStatus') {
    sendResponse({status: isDeadMansTabActive ? 'active' : 'inactive'});
  }
});

function activateDeadMansTab() {
  isDeadMansTabActive = true;
  isKeyHeld = false;
  showNotification(`Dead Man's Tab is ACTIVE! Hold down ${getKeyDisplayName(deadMansKey)} to keep the tab alive...`);
  
  // Add event listeners for key events
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);
  
  // Also listen for focus events to ensure we capture keys even when typing in inputs
  document.addEventListener('focusin', handleFocusIn, true);
  document.addEventListener('focusout', handleFocusOut, true);
}

function deactivateDeadMansTab() {
  isDeadMansTabActive = false;
  isKeyHeld = false;
  keyPressStartTime = null;
  
  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('keyup', handleKeyUp, true);
  document.removeEventListener('focusin', handleFocusIn, true);
  document.removeEventListener('focusout', handleFocusOut, true);
  
  showNotification('Dead Man\'s Tab is deactivated');
}

function handleKeyDown(event) {
  if (!isDeadMansTabActive) return;
  
  // Only respond to the specific dead man's key
  if (event.code === deadMansKey && !isKeyHeld) {
    isKeyHeld = true;
    keyPressStartTime = Date.now();
    showNotification(`Holding ${getKeyDisplayName(deadMansKey)} - Tab is safe!`);
  }
}

function handleKeyUp(event) {
  if (!isDeadMansTabActive) return;
  
  // If the released key is the dead man's key, close the tab immediately
  if (event.code === deadMansKey && isKeyHeld) {
    isKeyHeld = false;
    showNotification(`${getKeyDisplayName(deadMansKey)} released! Closing tab...`);
    
    // Close tab immediately
    chrome.runtime.sendMessage({action: 'closeTab'});
  }
}

function handleFocusIn(event) {
  if (!isDeadMansTabActive) return;
  
  // When focus enters an input field, we need to be extra careful
  // to capture key events that might be consumed by the input
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
    target.addEventListener('keydown', handleKeyDown, true);
    target.addEventListener('keyup', handleKeyUp, true);
  }
}

function handleFocusOut(event) {
  if (!isDeadMansTabActive) return;
  
  // Clean up event listeners from input fields
  const target = event.target;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
    target.removeEventListener('keydown', handleKeyDown, true);
    target.removeEventListener('keyup', handleKeyUp, true);
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

function showNotification(message) {
  // Create a temporary notification overlay
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Initialize - check if Dead Man's Tab is already active when the page loads
chrome.runtime.sendMessage({action: 'getStatus'}, (response) => {
  if (response && response.status === 'active') {
    // Load the saved key preference
    chrome.storage.sync.get(['deadMansKey'], (result) => {
      if (result.deadMansKey) {
        deadMansKey = result.deadMansKey;
      }
      activateDeadMansTab();
    });
  }
});
