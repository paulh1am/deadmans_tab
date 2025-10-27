# Dead Man's Tab - Chrome Extension

A Chrome extension that closes the current tab when you release a held key. Perfect for those moments when you need to stay focused or add a bit of danger to your browsing experience!

## Features

- 🚨 **One-click activation** - Simple popup interface
- ⌨️ **Any key works** - Hold down any key to keep the tab alive
- ⚠️ **Instant closure** - Tab closes immediately when you release the key
- 🎯 **Works everywhere** - Functions on any website
- 💀 **Skull and crossbones** - Themed interface

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dead_mans` folder
5. The extension should now appear in your extensions bar

## Usage

1. Click the Dead Man's Tab extension icon in your browser toolbar
2. Click the "🚨 ACTIVATE" button
3. Hold down any key on your keyboard
4. **Warning**: Release the key and your tab will close!

## How It Works

- The extension injects a content script into every webpage
- When activated, it listens for keydown and keyup events
- The first key you press becomes the "dead man's switch"
- When you release that key, the tab closes after a 1-second countdown

## Safety Features

- Visual notifications show when the extension is active
- 1-second delay before closing gives you a chance to react
- Easy deactivation through the popup
- Clear warnings about the extension's behavior

## File Structure

```
dead_mans/
├── manifest.json          # Extension configuration
├── content.js            # Content script (runs on web pages)
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.js             # Popup script logic
├── icons/               # Extension icons
│   └── icon.svg         # SVG icon (convert to PNG for production)
└── README.md            # This file
```

## Creating Icons

The extension includes an SVG icon that you'll need to convert to PNG format for the different sizes:

- 16x16 pixels
- 32x32 pixels  
- 48x48 pixels
- 128x128 pixels

You can use online SVG to PNG converters or tools like Inkscape to create these icons.

## Permissions

- `activeTab` - To interact with the current tab
- `tabs` - To close tabs when the key is released

## Development

To modify the extension:

1. Make your changes to the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh button on the Dead Man's Tab extension
4. Test your changes

## Warning

⚠️ **This extension will close your current tab when you release a key!** Make sure you've saved any important work before activating it.

Use responsibly and have fun! 💀
