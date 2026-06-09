#!/usr/bin/env python3
"""
Import historical messages from Signal Desktop into the summarizer database.
Signal Desktop uses SQLCipher (encrypted SQLite), so we need to decrypt it first.
"""

import os
import sys
import json
import sqlite3
import subprocess
import tempfile
import shutil
from datetime import datetime, timedelta

# Paths
SIGNAL_DESKTOP_PATH = os.path.expanduser("~/Library/Application Support/Signal")
SIGNAL_DB = os.path.join(SIGNAL_DESKTOP_PATH, "sql", "db.sqlite")
SIGNAL_CONFIG = os.path.join(SIGNAL_DESKTOP_PATH, "config.json")
OUTPUT_DB = os.path.join(os.path.dirname(__file__), "messages.db")

def get_encryption_key():
    """Get the encryption key from Signal Desktop config using macOS keychain."""
    try:
        # The key is stored encrypted, we need to use electron's safeStorage
        # But we can try using sqlcipher directly with the key from keychain
        result = subprocess.run(
            ["security", "find-generic-password", "-s", "Signal Safe Storage", "-w"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        print(f"Could not get key from keychain: {e}")
    return None

def export_with_signal_cli():
    """Alternative: use signal-cli to export messages if available."""
    pass

def main():
    print("Signal Desktop Message Importer")
    print("=" * 40)

    if not os.path.exists(SIGNAL_DB):
        print(f"Error: Signal Desktop database not found at {SIGNAL_DB}")
        sys.exit(1)

    print(f"Found Signal Desktop database: {SIGNAL_DB}")
    print(f"Database size: {os.path.getsize(SIGNAL_DB) / 1024 / 1024:.1f} MB")

    # Try to get encryption key
    key = get_encryption_key()

    if not key:
        print("\nThe Signal Desktop database is encrypted with SQLCipher.")
        print("To import historical messages, you have two options:\n")
        print("Option 1: Use signal-export tool (recommended)")
        print("  pip install signal-export")
        print("  sigexport --no-attachments ~/signal-export")
        print("  Then run: python import_from_export.py ~/signal-export\n")
        print("Option 2: Keep the collector running to gather new messages")
        print("  Messages will accumulate over time from now on.\n")
        sys.exit(0)

    print(f"Got encryption key, attempting to decrypt...")
    # If we got here, try to decrypt and import
    # This would require sqlcipher library

if __name__ == "__main__":
    main()
