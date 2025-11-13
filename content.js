// Dead Man's Tab - Content Script
// This script runs on every webpage and handles the key press/release logic

let isDeadMansTabActive = false;
let deadMansKey = null; // No default key - must be set by user
let isKeyHeld = false;
let keyPressStartTime = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activate') {
    deadMansKey = request.key;
    console.log('Dead Man\'s Tab: Activating with key:', deadMansKey);
    activateDeadMansTab();
    sendResponse({status: 'activated'});
  } else if (request.action === 'deactivate') {
    console.log('Dead Man\'s Tab: Deactivating');
    deactivateDeadMansTab();
    sendResponse({status: 'deactivated'});
  } else if (request.action === 'updateKey') {
    deadMansKey = request.key;
    console.log('Dead Man\'s Tab: Key updated to:', deadMansKey);
    sendResponse({status: 'keyUpdated'});
  } else if (request.action === 'getStatus') {
    sendResponse({status: isDeadMansTabActive ? 'active' : 'inactive'});
  }
});

function activateDeadMansTab() {
  isDeadMansTabActive = true;
  isKeyHeld = false;
  console.log('Dead Man\'s Tab: Switch is now ACTIVE');
  showVisualIndicator();
  
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
  console.log('Dead Man\'s Tab: Switch is now INACTIVE');
  
  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('keyup', handleKeyUp, true);
  document.removeEventListener('focusin', handleFocusIn, true);
  document.removeEventListener('focusout', handleFocusOut, true);
  
  hideVisualIndicator();
}

function handleKeyDown(event) {
  if (!isDeadMansTabActive) return;
  
  // Only respond to the specific dead man's key
  if (event.code === deadMansKey && !isKeyHeld) {
    isKeyHeld = true;
    keyPressStartTime = Date.now();
    console.log('Dead Man\'s Tab: Key held down - tab is safe');
    // No notification needed - user already knows they're holding the key
  }
}

function handleKeyUp(event) {
  if (!isDeadMansTabActive) return;
  
  // If the released key is the dead man's key, close the tab immediately
  if (event.code === deadMansKey && isKeyHeld) {
    isKeyHeld = false;
    console.log('Dead Man\'s Tab: Key released - closing tab!');
    // Close tab immediately without notification
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

function showVisualIndicator() {
  // Remove existing indicator if it exists
  hideVisualIndicator();
  
  // Create persistent visual indicator
  const indicator = document.createElement('div');
  indicator.id = 'dead-mans-tab-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    z-index: 10001;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 2px solid #fff;
    animation: pulse 2s infinite;
  `;
  indicator.textContent = '💀 DEAD MAN\'S TAB ACTIVE';
  
  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(indicator);
}

function hideVisualIndicator() {
  const indicator = document.getElementById('dead-mans-tab-indicator');
  if (indicator) {
    indicator.remove();
  }
}


// Initialize - check if Dead Man's Tab is already active when the page loads
chrome.runtime.sendMessage({action: 'getStatus'}, (response) => {
  if (response && response.status === 'active') {
    // Load the saved key preference
    chrome.storage.sync.get(['deadMansKey'], (result) => {
      if (result.deadMansKey) {
        deadMansKey = result.deadMansKey;
        console.log('Dead Man\'s Tab: Restoring active state with key:', deadMansKey);
        activateDeadMansTab();
      } else {
        console.log('Dead Man\'s Tab: No saved key found, deactivating');
        deactivateDeadMansTab();
      }
    });
  }
});
