# Sanitize I

A utility tool to clean trash from Schedule I game saves.

## ⚠️ Compatibility

**Note:** This tool has only been tested with v0.3.3f15. It may not work with other versions.

## 📋 Description

Sanitize I helps manage your Schedule I saves by cleaning out accumulated trash items that can potentially cause performance issues or save bloat. It specifically:

- Empties the `Items` array in `Trash.json`
- Clears the `GeneratedItems` arrays in all generator files

## 🛠️ Installation

1. Ensure you have [Node.js](https://nodejs.org/) installed
2. Clone or download this repository
3. Navigate to the directory and install dependencies:

```bash
cd Sanitize1
npm install
```

## 🚀 Usage

Run the application:

```bash
node index.mjs
```

The tool will:

1. Detect available players (using your Steam ID)
2. Allow you to select a save
3. Clean trash items from the selected save
4. Display a summary of the cleaning operation

## 📁 Save Locations

The tool automatically locates save files at:
`%USERPROFILE%\AppData\LocalLow\TVGS\Schedule I\Saves`

## 📝 Notes

- Always backup your saves before using this tool
- This is an unofficial utility and is not affiliated with TVGS
- Use at your own risk

## 🔧 Requirements

- Node.js 14.x or higher
- npm packages:
  - @inquirer/prompts
  - chalk
