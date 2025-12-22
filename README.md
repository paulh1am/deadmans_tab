# 💀 Dead Man's Tab

A Chrome extension that closes your tab the moment you release a key. For when you prefer a dad man's close.

<!-- TODO: Add demo GIF here -->
<!-- Recommended: 600-800px wide, showing the full flow:
     1. Click extension icon
     2. Click "Activate" 
     3. Hold a key (show the countdown or instant activation)
     4. Release the key
     5. Tab closes
     Tools: LICEcap, Gifox, or ScreenToGif -->

## What is this?

Dead Man's Tab turns any key into a dead man's switch for your browser tab. As long as you hold the key, the tab stays open. The moment you let go—it's gone.

It's for when you'd rather keep something on the DL. And who know's - we really could drop dead at any moment.

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the `dead_mans` folder
5. The skull icon should appear in your extensions toolbar

<!-- TODO: Uncomment when published to Chrome Web Store
### From Chrome Web Store
[Install Dead Man's Tab](link-here) -->

## How to Use

1. **Click the extension icon** in your toolbar
2. **Click "Activate"** and either:
   - **Already holding a key?** That key becomes your dead man's switch instantly
   - **Not holding a key?** Press and hold any key during the 3 seconds launch countdown.
3. **Keep holding the key** — a red indicator confirms the switch is active
4. **Release the key** — the tab closes immediately

That's it. Hold to browse, release to close.

## Use Cases

- **Focus mode**: Open a distracting site, activate the switch. You can only stay if you're committed enough to hold a key – browse a little more with one foot out the door!
- **Presentations**: Risky live demos where failure means the tab disappears. We haven't tested this but maybe it would help.
- **Privacy**: Shopping for a secret gift? Watching the game instead of 'working'? Browsing a sensitive or private topic? Worried you'll be embarrassed if you were to drop dead while browsing? Worry no more!

## How It Works

The extension uses three components:

- **Popup** (`popup.js`) — The activation interface and key capture countdown
- **Content Script** (`content.js`) — Runs on webpages, listens for key events, triggers the close
- **Background Worker** (`background.js`) — Handles the actual tab closing via Chrome's API

When activated, the content script listens for your chosen key. A backup polling mechanism ensures the tab closes even if the browser misses the key release event.

## Permissions

| Permission | Why |
|------------|-----|
| `tabs` | Required to close the tab |
| `storage` | Remembers your preferred dead man's key |
| `activeTab` | Communicates with the current tab's content script |

No data is collected. No external requests are made.

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on Dead Man's Tab
4. Test your changes

The extension consists of:

```
dead_mans/
├── manifest.json     # Extension configuration
├── background.js     # Service worker (tab management)
├── content.js        # Injected into pages (key detection)
├── popup.html        # Extension popup markup
├── popup.js          # Popup logic
└── icons/            # Extension icons
```

## Limitations

- Won't work on `chrome://` pages, the Chrome Web Store, or other protected URLs
- Some websites with aggressive keyboard handling may interfere (rare)
- The switch only affects the tab where it was activated

## License

MIT — do whatever you want with it.

## Contributing

Found a bug? Have an idea? Open an issue or submit a PR.

---

*Remember: every tab you love will eventually close. This extension just makes you confront that reality directly.*
