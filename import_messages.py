import sqlite3
import sys
import os

def log_message(message):
    print(f"[LOG] {message}")

if len(sys.argv) != 3:
    print("Usage: python import_messages.py <source_db> <destination_db>")
    sys.exit(1)

source_db = sys.argv[1]
destination_db = sys.argv[2]

if not os.path.exists(source_db):
    print(f"Error: Source database '{source_db}' does not exist.")
    sys.exit(1)

try:
    conn = sqlite3.connect(destination_db)
    cursor = conn.cursor()

    # Create the messages table if it doesn't exist
    cursor.execute("""
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
    );
    """)

    conn.execute(f"ATTACH DATABASE '{source_db}' AS src")

    # Get the count of messages in the source database
    src_count = cursor.execute("SELECT COUNT(*) FROM src.messages").fetchone()[0]
    log_message(f"Source database has {src_count} messages")

    # Insert into the messages table only new rows based on the primary key
    cursor.execute("""
    INSERT INTO messages
    SELECT * FROM src.messages
    WHERE NOT EXISTS (
        SELECT 1 FROM messages WHERE messages.id = src.messages.id
    );
    """)

    # Get the count of inserted messages
    inserted_count = cursor.rowcount
    log_message(f"Inserted {inserted_count} new messages")

    conn.commit()
    conn.execute("DETACH DATABASE src")

    # Get the final count of messages in the destination database
    dest_count = cursor.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    log_message(f"Destination database now has {dest_count} messages")

except sqlite3.Error as e:
    print(f"SQLite error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    if conn:
        conn.close()

log_message("Import process completed")
