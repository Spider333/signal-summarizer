#!/bin/bash
#
# Signal Summarizer Health Check
# Checks: signal-cli, collector, message freshness, summary age, deploy status
#

DB_FILE="/Users/davidstancel/dev/signal-summarizer/messages.db"
SUMMARY_DIR="/Users/davidstancel/dev/signal-summarizer"
GREEN="\033[32m✓"
RED="\033[31m✗"
YELLOW="\033[33m⚠"
RESET="\033[0m"

echo "Signal Summarizer Health Check"
echo "=============================="
echo ""

ISSUES=0

# 1. signal-cli process
if pgrep -f "signal-cli" > /dev/null 2>&1; then
    echo -e "$GREEN signal-cli process running$RESET"
else
    echo -e "$RED signal-cli process NOT running$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 2. Collector process
if pgrep -f "signal_message_processor" > /dev/null 2>&1; then
    COLLECTOR_PID=$(pgrep -f "signal_message_processor" | head -1)
    echo -e "$GREEN collector running (PID $COLLECTOR_PID)$RESET"
else
    echo -e "$RED collector NOT running$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 3. Collector cron job
if crontab -l 2>/dev/null | grep -q "start-collector-bg"; then
    echo -e "$GREEN collector cron watchdog active$RESET"
else
    echo -e "$RED collector cron watchdog NOT found$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 4. Summarizer cron job
if crontab -l 2>/dev/null | grep -q "signal-summarizer.*launchd-wrapper\|auto-summarize"; then
    echo -e "$GREEN summarizer cron job active$RESET"
else
    echo -e "$RED summarizer cron job NOT found$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 5. Latest message timestamp
if [ -f "$DB_FILE" ]; then
    LATEST_TS=$(sqlite3 "$DB_FILE" "SELECT MAX(timestamp) FROM messages;" 2>/dev/null)
    if [ -n "$LATEST_TS" ] && [ "$LATEST_TS" -gt 0 ] 2>/dev/null; then
        LATEST_SEC=$(( LATEST_TS / 1000 ))
        NOW=$(date +%s)
        AGE_MIN=$(( (NOW - LATEST_SEC) / 60 ))
        LATEST_DATE=$(date -r "$LATEST_SEC" '+%Y-%m-%d %H:%M')

        if [ "$AGE_MIN" -lt 120 ]; then
            echo -e "$GREEN latest message: $LATEST_DATE (${AGE_MIN}m ago)$RESET"
        elif [ "$AGE_MIN" -lt 360 ]; then
            echo -e "$YELLOW latest message: $LATEST_DATE (${AGE_MIN}m ago — getting stale)$RESET"
        else
            echo -e "$RED latest message: $LATEST_DATE (${AGE_MIN}m ago — STALE)$RESET"
            ISSUES=$((ISSUES + 1))
        fi
    else
        echo -e "$RED no messages in database$RESET"
        ISSUES=$((ISSUES + 1))
    fi

    MSG_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM messages;" 2>/dev/null)
    echo "  Total messages in DB: $MSG_COUNT"
else
    echo -e "$RED messages.db not found$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 6. Latest summary file
LATEST_SUMMARY=$(ls -t "$SUMMARY_DIR"/summary_*.md 2>/dev/null | head -1)
if [ -n "$LATEST_SUMMARY" ]; then
    SUMMARY_MOD=$(stat -f %m "$LATEST_SUMMARY" 2>/dev/null)
    NOW=$(date +%s)
    SUMMARY_AGE_HR=$(( (NOW - SUMMARY_MOD) / 3600 ))
    SUMMARY_DATE=$(date -r "$SUMMARY_MOD" '+%Y-%m-%d %H:%M')
    SUMMARY_NAME=$(basename "$LATEST_SUMMARY")

    if [ "$SUMMARY_AGE_HR" -lt 2 ]; then
        echo -e "$GREEN latest summary: $SUMMARY_NAME ($SUMMARY_DATE)$RESET"
    elif [ "$SUMMARY_AGE_HR" -lt 24 ]; then
        echo -e "$YELLOW latest summary: $SUMMARY_NAME ($SUMMARY_DATE — ${SUMMARY_AGE_HR}h ago)$RESET"
    else
        echo -e "$RED latest summary: $SUMMARY_NAME ($SUMMARY_DATE — ${SUMMARY_AGE_HR}h ago)$RESET"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "$RED no summary files found$RESET"
    ISSUES=$((ISSUES + 1))
fi

# 7. Vercel deploy (check if vercel is available)
if command -v vercel &>/dev/null; then
    DEPLOY_STATUS=$(cd "$SUMMARY_DIR/web" 2>/dev/null && vercel ls 2>&1 | grep -E "Ready|Error" | head -1)
    if echo "$DEPLOY_STATUS" | grep -q "Ready"; then
        echo -e "$GREEN latest Vercel deploy: Ready$RESET"
    elif [ -n "$DEPLOY_STATUS" ]; then
        echo -e "$YELLOW latest Vercel deploy: $DEPLOY_STATUS$RESET"
    else
        echo -e "$YELLOW Vercel status unknown (may need login)$RESET"
    fi
else
    echo -e "$YELLOW vercel CLI not in PATH$RESET"
fi

echo ""
if [ "$ISSUES" -eq 0 ]; then
    echo -e "${GREEN} All systems healthy$RESET"
else
    echo -e "${RED} $ISSUES issue(s) found$RESET"
fi
