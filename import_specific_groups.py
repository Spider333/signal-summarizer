#!/usr/bin/env python3
"""Import specific groups from signal-export."""

import os
import sqlite3
import re
from datetime import datetime
from pathlib import Path

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "signal-export")
OUTPUT_DB = os.path.join(os.path.dirname(__file__), "messages.db")

# Groups to import
GROUPS_TO_IMPORT = [
    "Paraguajskífešáci",
    "GlobalOpportunists",
    "Skoroparaguajskífešáci",
]

def parse_markdown_messages(md_file):
    """Parse messages from a signal-export markdown file."""
    messages = []

    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match message blocks
    pattern = r'\[(\d{4}-\d{2}-\d{2}[,\s]+\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^\n]+)\n((?:(?!\[\d{4}).)*)'

    matches = re.findall(pattern, content, re.DOTALL)

    for timestamp_str, sender, message in matches:
        message = message.strip()
        if not message or message.startswith('!['):
            continue

        try:
            for fmt in ['%Y-%m-%d, %H:%M:%S', '%Y-%m-%d, %H:%M', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M']:
                try:
                    dt = datetime.strptime(timestamp_str.strip(), fmt)
                    break
                except ValueError:
                    continue
            else:
                continue

            timestamp_ms = int(dt.timestamp() * 1000)
        except Exception:
            continue

        messages.append({
            'sender': sender.strip(),
            'timestamp': timestamp_ms,
            'message': message[:5000]
        })

    return messages

def main():
    conn = sqlite3.connect(OUTPUT_DB)
    cursor = conn.cursor()

    # Ensure table exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        sourceName TEXT,
        timestamp INTEGER,
        message TEXT,
        groupId TEXT,
        groupName TEXT,
        attachmentPaths TEXT,
        attachmentDescriptions TEXT,
        processedAt INTEGER,
        quoteId INTEGER,
        quoteAuthor TEXT,
        quoteText TEXT
    )
    ''')

    total_imported = 0

    for group_folder in GROUPS_TO_IMPORT:
        folder_path = os.path.join(EXPORT_DIR, group_folder)
        if not os.path.isdir(folder_path):
            print(f"Folder not found: {folder_path}")
            continue

        md_files = list(Path(folder_path).glob('*.md'))
        if not md_files:
            print(f"No markdown files in {group_folder}")
            continue

        group_id = f"imported_{group_folder}"
        group_name = group_folder

        # Delete existing messages for this group
        cursor.execute('DELETE FROM messages WHERE groupId = ?', (group_id,))

        messages = parse_markdown_messages(md_files[0])
        print(f"{group_name}: {len(messages)} messages")

        for msg in messages:
            cursor.execute('''
                INSERT INTO messages (source, sourceName, timestamp, message, groupId, groupName, attachmentPaths, attachmentDescriptions, processedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                msg['sender'],
                msg['sender'],
                msg['timestamp'],
                msg['message'],
                group_id,
                group_name,
                '[]',
                '',
                None
            ))
            total_imported += 1

    conn.commit()
    conn.close()
    print(f"\nTotal imported: {total_imported} messages")

if __name__ == "__main__":
    main()
