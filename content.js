// Dead Man's Tab - Content Script
// This script runs on every webpage and handles the key press/release logic

let isDeadMansTabActive = false;
let deadMansKey = null; // No default key - must be set by user
let isKeyHeld = false;
let keyPressStartTime = null;
let safetyCheckInterval = null;
let activationTime = null;
let keyWasEverHeld = false; // Track if key was ever held since activation

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
  keyWasEverHeld = false; // Reset flag on activation
  activationTime = Date.now();
  console.log('Dead Man\'s Tab: Switch is now ACTIVE with key:', deadMansKey);
  showVisualIndicator();
  
  // Add event listeners for key events
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);
  
  // Also listen for focus events to ensure we capture keys even when typing in inputs
  document.addEventListener('focusin', handleFocusIn, true);
  document.addEventListener('focusout', handleFocusOut, true);
  
  // Start periodic safety check - closes tab if key is released after being held
  startSafetyCheck();
}

function deactivateDeadMansTab() {
  console.log('Dead Man\'s Tab: Deactivating - resetting all state');
  
  // CRITICAL: Set to false FIRST to prevent any closing attempts
  isDeadMansTabActive = false;
  isKeyHeld = false;
  keyWasEverHeld = false; // Reset flag
  keyPressStartTime = null;
  activationTime = null;
  deadMansKey = null; // Clear the key to prevent any accidental matches
  
  // Stop safety check immediately - this is critical!
  stopSafetyCheck();
  
  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown, true);
  document.removeEventListener('keyup', handleKeyUp, true);
  document.removeEventListener('focusin', handleFocusIn, true);
  document.removeEventListener('focusout', handleFocusOut, true);
  
  hideVisualIndicator();
  
  console.log('Dead Man\'s Tab: Deactivation complete - all state reset, safety check stopped');
}

function startSafetyCheck() {
  // Clear any existing interval
  stopSafetyCheck();
  
  // Safety check: Backup mechanism in case keyup event is missed
  // Only runs when switch is active and verifies state before closing
  safetyCheckInterval = setInterval(() => {
    // CRITICAL: Must verify switch is still active - if not, stop immediately
    if (!isDeadMansTabActive) {
      console.log('Dead Man\'s Tab: Safety check stopped - switch is not active');
      stopSafetyCheck();
      return;
    }
    
    // CRITICAL: Must verify deadMansKey is set
    if (!deadMansKey) {
      console.log('Dead Man\'s Tab: Safety check stopped - no dead man\'s key set');
      stopSafetyCheck();
      return;
    }
    
    // Only check if key is not currently held
    if (!isKeyHeld) {
      const timeSinceActivation = Date.now() - activationTime;
      
      // Close tab if:
      // 1. Dead man's key was held and then released (keyWasEverHeld = true)
      //    This means the user was using the switch and released it
      // 2. OR if no dead man's key has been held for 3 seconds after activation
      //    This is a failsafe for edge cases where activation happened but key was never pressed
      if (keyWasEverHeld) {
        // Dead man's key was held then released - close tab (backup to keyup handler)
        // Final state verification before closing
        if (isDeadMansTabActive && deadMansKey) {
          console.log('Dead Man\'s Tab: Safety check - dead man\'s key was held but now released, closing tab!');
          safeCloseTab();
        } else {
          console.log('Dead Man\'s Tab: Safety check - state changed, aborting close');
          stopSafetyCheck();
        }
      } else if (timeSinceActivation > 3000 && activationTime) {
        // No dead man's key has been held for 3 seconds - edge case failsafe
        // This shouldn't happen in normal flow (user should press key immediately)
        // Final state verification before closing
        if (isDeadMansTabActive && deadMansKey) {
          console.log('Dead Man\'s Tab: Safety check - no dead man\'s key held for 3 seconds, closing tab!');
          safeCloseTab();
        } else {
          console.log('Dead Man\'s Tab: Safety check - state changed, aborting close');
          stopSafetyCheck();
        }
      }
    }
  }, 200);
}

function stopSafetyCheck() {
  if (safetyCheckInterval) {
    clearInterval(safetyCheckInterval);
    safetyCheckInterval = null;
  }
}

function safeCloseTab() {
  // CRITICAL: Always verify state is active before closing
  if (!isDeadMansTabActive) {
    console.warn('Dead Man\'s Tab: BLOCKED - Attempted to close tab but switch is not active!');
    return false;
  }
  
  // CRITICAL: Verify deadMansKey is set
  if (!deadMansKey) {
    console.warn('Dead Man\'s Tab: BLOCKED - Attempted to close tab but no dead man\'s key is set!');
    return false;
  }
  
  console.log('Dead Man\'s Tab: Closing tab (state verified: active=true, key=' + deadMansKey + ')');
  chrome.runtime.sendMessage({action: 'closeTab'});
  return true;
}

function handleKeyDown(event) {
  if (!isDeadMansTabActive) return;
  
  // Only respond to the specific dead man's key
  if (event.code === deadMansKey && !isKeyHeld) {
    isKeyHeld = true;
    keyWasEverHeld = true; // Mark that key has been held
    keyPressStartTime = Date.now();
    console.log('Dead Man\'s Tab: Key held down - tab is safe');
    // No notification needed - user already knows they're holding the key
  }
}

function handleKeyUp(event) {
  if (!isDeadMansTabActive) {
    console.log('Dead Man\'s Tab: KeyUp ignored - switch not active');
    return;
  }
  
  // Verify deadMansKey is set
  if (!deadMansKey) {
    console.log('Dead Man\'s Tab: KeyUp ignored - no dead man\'s key set');
    return;
  }
  
  console.log('Dead Man\'s Tab: KeyUp event detected - code:', event.code, 'key:', event.key, 'deadMansKey:', deadMansKey, 'isKeyHeld:', isKeyHeld);
  
  // If the released key is the dead man's key, close the tab immediately
  if (event.code === deadMansKey) {
    console.log('Dead Man\'s Tab: Dead man\'s key match confirmed! Closing tab...');
    
    // Reset key held state
    isKeyHeld = false;
    
    // Use safe close function that verifies state
    const closed = safeCloseTab();
    if (!closed) {
      console.error('Dead Man\'s Tab: ERROR - safeCloseTab returned false! State:', {
        isDeadMansTabActive,
        deadMansKey,
        isKeyHeld
      });
    } else {
      console.log('Dead Man\'s Tab: Tab close request sent successfully');
    }
  } else {
    console.log('Dead Man\'s Tab: KeyUp event does not match dead man\'s key (expected:', deadMansKey, 'got:', event.code, ')');
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
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
  `;
  indicator.textContent = '💀 DEAD MAN\'S TAB ACTIVE';
  indicator.title = 'Click to open extension popup';
  
  // Add hover effect
  indicator.addEventListener('mouseenter', () => {
    indicator.style.background = '#ff6666';
    indicator.style.transform = 'scale(1.05)';
  });
  indicator.addEventListener('mouseleave', () => {
    indicator.style.background = '#ff4444';
    indicator.style.transform = 'scale(1)';
  });
  
  // Make it clickable - send message to background to open popup
  indicator.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent any page interactions
    console.log('Dead Man\'s Tab: Indicator clicked - requesting popup open');
    chrome.runtime.sendMessage({action: 'openPopup'}, (response) => {
      if (chrome.runtime.lastError || (response && !response.success)) {
        console.log('Dead Man\'s Tab: Could not open popup programmatically');
        // Show a brief message directing user to click extension icon
        const originalText = indicator.textContent;
        indicator.textContent = '👆 Click extension icon';
        indicator.style.background = '#ff6666';
        setTimeout(() => {
          indicator.textContent = originalText;
          indicator.style.background = '#ff4444';
        }, 2000);
      } else {
        console.log('Dead Man\'s Tab: Popup open request sent');
      }
    });
  });
  
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


// Initialize - DO NOT automatically restore active state on new tabs
// The dead man's switch should only be active on the tab where user clicked "Begin"
// New tabs should start in inactive state
console.log('Dead Man\'s Tab: Content script loaded - starting in inactive state');
// Explicitly ensure we're inactive
isDeadMansTabActive = false;
isKeyHeld = false;
keyWasEverHeld = false;
deadMansKey = null;
stopSafetyCheck();
