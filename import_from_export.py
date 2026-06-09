#!/usr/bin/env python3
"""
Import messages from signal-export output into the summarizer database.
"""

import os
import sys
import json
import sqlite3
import re
from datetime import datetime
from pathlib import Path

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "signal-export")
OUTPUT_DB = os.path.join(os.path.dirname(__file__), "messages.db")

def parse_markdown_messages(md_file):
    """Parse messages from a signal-export markdown file."""
    messages = []

    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match message blocks
    # Format: ### [timestamp] sender_name\nmessage_text
    # Or: [timestamp] sender_name\nmessage_text
    pattern = r'\[(\d{4}-\d{2}-\d{2},?\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^\n]+)\n((?:(?!\[\d{4}).)*)'

    matches = re.findall(pattern, content, re.DOTALL)

    for timestamp_str, sender, message in matches:
        # Clean up the message
        message = message.strip()
        if not message or message.startswith('!['):  # Skip empty or image-only
            continue

        # Parse timestamp
        try:
            # Try different formats
            for fmt in [
                '%Y-%m-%d, %H:%M:%S',
                '%Y-%m-%d, %H:%M',
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%d %H:%M',
            ]:
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
            'message': message[:5000]  # Limit message length
        })

    return messages

def get_group_info(folder_path):
    """Try to determine if this is a group chat and get info."""
    folder_name = os.path.basename(folder_path)

    # Check if there's a chat.md or similar
    md_files = list(Path(folder_path).glob('*.md'))
    if not md_files:
        return None, None, False

    # Read first file to check for multiple senders
    messages = parse_markdown_messages(md_files[0])
    senders = set(m['sender'] for m in messages)

    # If more than 2 unique senders, likely a group
    is_group = len(senders) > 2

    return folder_name, md_files[0], is_group

def main():
    print("Signal Export Importer")
    print("=" * 40)

    if not os.path.exists(EXPORT_DIR):
        print(f"Error: Export directory not found at {EXPORT_DIR}")
        print("Run 'sigexport /path/to/output' first")
        sys.exit(1)

    # Connect to database
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

    # Get existing message count
    cursor.execute("SELECT COUNT(*) FROM messages")
    existing_count = cursor.fetchone()[0]
    print(f"Existing messages in database: {existing_count}")

    # Process each conversation folder
    total_imported = 0
    groups_found = []

    for folder in sorted(os.listdir(EXPORT_DIR)):
        folder_path = os.path.join(EXPORT_DIR, folder)
        if not os.path.isdir(folder_path):
            continue

        group_name, md_file, is_group = get_group_info(folder_path)
        if not md_file:
            continue

        if not is_group:
            continue  # Skip 1:1 chats, only import groups

        # Generate a consistent group ID from the folder name
        group_id = f"imported_{folder}"

        messages = parse_markdown_messages(md_file)
        if not messages:
            continue

        groups_found.append({
            'name': group_name,
            'id': group_id,
            'count': len(messages)
        })

        # Import messages
        for msg in messages:
            # Check if message already exists (by timestamp and sender)
            cursor.execute('''
                SELECT id FROM messages
                WHERE timestamp = ? AND sourceName = ? AND groupId = ?
            ''', (msg['timestamp'], msg['sender'], group_id))

            if cursor.fetchone():
                continue  # Skip duplicate

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

    print(f"\nImported {total_imported} new messages")
    print(f"\nGroups found ({len(groups_found)}):")
    for g in sorted(groups_found, key=lambda x: -x['count'])[:20]:
        print(f"  - {g['name']}: {g['count']} messages (ID: {g['id']})")

    if len(groups_found) > 20:
        print(f"  ... and {len(groups_found) - 20} more groups")

    # Get final count
    cursor.execute("SELECT COUNT(*) FROM messages")
    final_count = cursor.fetchone()[0]
    print(f"\nTotal messages in database: {final_count}")

    conn.close()

if __name__ == "__main__":
    main()
