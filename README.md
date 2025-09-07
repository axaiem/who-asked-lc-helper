# who-asked-lc-helper

A browser extension that enhances LeetCode with company tags and additional problem information.

## Features

- Shows company tags for LeetCode problems
- Displays problem frequency and difficulty
- Enhances the LeetCode experience with additional context

## Project Structure

```
who-asked-lc-helper/
├── README.md
├── manifest.json          # Browser extension manifest
├── content.js             # Content script for LeetCode pages
├── data/
│   └── problems.json      # Generated from repo CSVs
├── scripts/
│   └── build_dataset.py   # Pulls from GitHub & merges CSVs into JSON
└── icons/
    └── icon128.png        # Extension icon
```

## Setup

1. **Build the dataset:**
   ```bash
   cd scripts
   python build_dataset.py
   ```

2. **Load the extension:**
   - Open Chrome/Edge and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

## Usage

The extension automatically activates on LeetCode problem pages and displays company tags and additional information.

## Development

- `content.js` - Main content script that runs on LeetCode pages
- `scripts/build_dataset.py` - Script to build the problems dataset from GitHub repositories
- `data/problems.json` - Generated dataset with problem information and company tags
