# Log File Viewer

A lightweight, browser-based tool for viewing and navigating log files (debug level stdout/stderr) to see the prompts and errors clearly.

## Features

- **Syntax Highlighting:** Differentiates between various log types (`error`, `prompt`, `response`) using distinct colors based on the Solarized Dark theme.
- **Keyboard Navigation:**
  - `j` or `↓`: Navigate down through log entries.
  - `k` or `↑`: Navigate up through log entries.
  - `h` or `←`: Skip to the previous `prompt`, `response`, or `error` entry.
  - `l` or `→`: Skip to the next `prompt`, `response`, or `error` entry.
  - `H`: Skip to the previous `response` entry.
  - `L`: Skip to the next `response` entry.
  - `z`: Skip to the previous `error` entry.
  - `x`: Skip to the next `error` entry.
  - `?`: Display a help overlay with all keyboard shortcuts.
- **Dynamic Log Filename:** Specify the log file to view via a `filename` GET parameter in the URL. Defaults to `output.log` if unspecified or invalid.

## Installation


Ensure that the log files you wish to view are located in the same directory or a publicly accessible directory on your server.

You can use any static file server. For a quick setup using Python's built-in server:
     ```bash
     python3 -m http.server 8000
     ```
Access the viewer by navigating to `http://localhost:8000/logviewer.html?filename=output.log` in your browser.

## Usage

Use the keyboard shortcuts listed below to navigate and interact with the log entries.

Press `?` to display an overlay with all available keyboard shortcuts. Press any key to dismiss the overlay.

## Keyboard Shortcuts

- `j` or `↓`: Navigate down through log entries.
- `k` or `↑`: Navigate up through log entries.
- `h` or `←`: Skip to the previous `prompt`, `response`, or `error` entry.
- `l` or `→`: Skip to the next `prompt`, `response`, or `error` entry.
- `H`: Skip to the previous `response` entry.
- `L`: Skip to the next `response` entry.
- `z`: Skip to the previous `error` entry.
- `x`: Skip to the next `error` entry.
- `?`: Display/hide the keyboard shortcuts overlay.
