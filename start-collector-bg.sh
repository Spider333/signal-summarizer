#!/bin/bash
#
# Signal collector watchdog — ensures exactly one collector + one signal-cli.
# Runs via cron every 2 minutes. Kills orphan Java processes before restarting.
#

PIDFILE="/Users/davidstancel/dev/signal-summarizer/collector.pid"
LOGFILE="/Users/davidstancel/dev/signal-summarizer/collector.log"
DB_FILE="/Users/davidstancel/dev/signal-summarizer/messages.db"
VENV_PYTHON="/Users/davidstancel/Library/Caches/pypoetry/virtualenvs/signal-message-processor-mTovnFmT-py3.9/bin/python"

cd /Users/davidstancel/dev/signal-message-processor || exit 1

# Helper: kill collector + all orphan signal-cli Java processes
kill_all_signal() {
    local pid="$1"
    [ -n "$pid" ] && kill "$pid" 2>/dev/null
    # Kill any orphan signal-cli Java processes
    pkill -f "org.asamk.signal.Main" 2>/dev/null
    sleep 2
    pkill -9 -f "org.asamk.signal.Main" 2>/dev/null
    [ -n "$pid" ] && kill -9 "$pid" 2>/dev/null
    rm -f "$PIDFILE"
}

# Check if already running
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        # Check staleness — if latest message is >2 hours old, kill and restart
        if [ -f "$DB_FILE" ]; then
            LATEST_TS=$(sqlite3 "$DB_FILE" "SELECT MAX(timestamp) FROM messages;" 2>/dev/null)
            NOW_MS=$(( $(date +%s) * 1000 ))
            TWO_HOURS_MS=7200000
            if [ -n "$LATEST_TS" ] && [ "$LATEST_TS" -gt 0 ] 2>/dev/null; then
                AGE_MS=$(( NOW_MS - LATEST_TS ))
                if [ "$AGE_MS" -gt "$TWO_HOURS_MS" ]; then
                    echo "$(date): Collector stale (latest message $(( AGE_MS / 60000 )) min ago). Restarting..."
                    kill_all_signal "$PID"
                else
                    echo "Collector running (PID $PID), latest message $(( AGE_MS / 60000 )) min ago"
                    exit 0
                fi
            else
                echo "Collector running (PID $PID), no messages in DB yet"
                exit 0
            fi
        else
            echo "Collector already running (PID $PID)"
            exit 0
        fi
    else
        # Collector died — clean up orphan Java processes too
        echo "$(date): Collector PID $PID dead. Cleaning up orphans..."
        kill_all_signal ""
    fi
fi

# Safety: kill any leftover signal-cli processes before starting fresh
ORPHANS=$(pgrep -f "org.asamk.signal.Main" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ORPHANS" -gt 0 ]; then
    echo "$(date): Killing $ORPHANS orphan signal-cli processes..."
    kill_all_signal ""
fi

# Start the collector in background
echo "$(date): Starting Signal message collector..."
nohup "$VENV_PYTHON" signal_message_processor.py --log-level INFO >> "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
echo "Collector started (PID $(cat "$PIDFILE"))"
