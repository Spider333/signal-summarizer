#!/bin/bash
#
# Auto-summarize Signal groups and update website
# Usage: ./auto-summarize.sh [days]
#   days: number of days to look back (default: 3)
#
# Note: not using set -e because summarize_group uses return codes for counting

SCRIPT_DIR="/Users/davidstancel/dev/signal-summarizer"
LOCKFILE="/tmp/signal-summarizer.lock"
VENV_PYTHON="/Users/davidstancel/Library/Caches/pypoetry/virtualenvs/signal-summarizer-Y55dha3X-py3.11/bin/python"

# --- Lock file with 30-min stale detection ---
if [ -f "$LOCKFILE" ]; then
    LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null | head -1)
    LOCK_TIME=$(stat -f %m "$LOCKFILE" 2>/dev/null)
    NOW=$(date +%s)
    LOCK_AGE=$(( NOW - LOCK_TIME ))

    if [ "$LOCK_AGE" -gt 1800 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] Stale lock (${LOCK_AGE}s old, PID $LOCK_PID). Removing."
        rm -f "$LOCKFILE"
    elif ps -p "$LOCK_PID" > /dev/null 2>&1; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [SKIP] Another instance running (PID $LOCK_PID, ${LOCK_AGE}s old). Exiting."
        exit 0
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] Dead lock (PID $LOCK_PID not running). Removing."
        rm -f "$LOCKFILE"
    fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# --- Setup ---
cd "$SCRIPT_DIR" || { echo "$(date '+%Y-%m-%d %H:%M:%S') [FATAL] Cannot cd to $SCRIPT_DIR"; exit 1; }

source .env 2>/dev/null || true
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Load nvm for node/npm/vercel
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

DAYS=${1:-3}
SINCE_DATE=$(date -v-${DAYS}d +%Y-%m-%d)

echo ""
echo "$(date '+%Y-%m-%d %H:%M:%S') =========================================="
echo "Signal Group Auto-Summarizer"
echo "=========================================="
echo "Looking back: $DAYS days (since $SINCE_DATE)"
echo ""

echo "Step 1: Checking for groups with recent messages..."
echo ""

# Get groups with messages in the date range
sqlite3 messages.db "SELECT groupName, COUNT(*) as count FROM messages WHERE timestamp >= strftime('%s', '$SINCE_DATE') * 1000 AND groupId IS NOT NULL GROUP BY groupId HAVING count > 0 ORDER BY count DESC;" | while IFS='|' read -r name count; do
    echo "  - $name: $count messages"
done
echo ""

echo "Step 2: Generating summaries..."
echo ""

SUMMARIES_GENERATED=0
ERRORS=0

# Function to summarize a group by name pattern
summarize_group() {
    local group_pattern="$1"
    local output_file="$2"
    local display_name="$3"

    # Find group ID by name pattern (case-insensitive)
    local group_id=$(sqlite3 messages.db "SELECT groupId FROM messages WHERE lower(groupName) LIKE lower('%$group_pattern%') AND groupId IS NOT NULL GROUP BY groupId LIMIT 1;")

    if [ -z "$group_id" ]; then
        return 0
    fi

    local msg_count=$(sqlite3 messages.db "SELECT COUNT(*) FROM messages WHERE groupId='$group_id' AND timestamp >= strftime('%s', '$SINCE_DATE') * 1000;")

    if [ "$msg_count" -gt 0 ]; then
        echo "$(date '+%H:%M:%S') Summarizing $display_name ($msg_count messages)..."
        if perl -e 'alarm 600; exec @ARGV' "$VENV_PYTHON" summarize_signal_group.py --group "$group_id" --since "$SINCE_DATE" --output "$output_file" 2>&1 | tail -3; then
            echo "  ✓ Done"
            SUMMARIES_GENERATED=$((SUMMARIES_GENERATED + 1))
        else
            echo "  ✗ FAILED (exit $?)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
}

# Your requested groups
summarize_group "Paraguajskí fešáci" "summary_paraguajski_fesaci.md" "Paraguajskí fešáci"
summarize_group "Skoro paraguajskí fešáci" "summary_skoro_paraguajski_fesaci.md" "Skoro paraguajskí fešáci"
summarize_group "Global Opportunists" "summary_global_opportunists.md" "Global Opportunists"
summarize_group "Bitcoin KYC" "summary_bitcoin_kyc_tax.md" "Bitcoin KYC & Tax"
summarize_group "LLC" "summary_llc.md" "LLC"
summarize_group "SOLO BoG" "summary_solo_bog.md" "Solo BoG"
summarize_group "LiberationTravel" "summary_liberation_travel.md" "Liberation Travel"
summarize_group "AI x FEYTOPIA" "summary_ai_feytopia.md" "AI x FEYTOPIA"
summarize_group "XAPOCZ" "summary_xapocz_sk.md" "XAPOCZ/SK komunita"
summarize_group "Bordel" "summary_bordel_hackerspace.md" "Bordel | Hackerspace"

echo ""

if [ "$SUMMARIES_GENERATED" -eq 0 ]; then
    echo "No groups with recent messages found."
    echo "Make sure the message collector is running (launchd: com.davidstancel.signal-collector)."
    exit 0
fi

echo "Step 3: Updating website..."
cd web || { echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Cannot cd to web/"; exit 1; }
npm run generate 2>&1 | tail -5
echo ""

echo "Step 4: Deploying to Vercel..."
vercel --prod --yes 2>&1 | grep -E "(Production:|Aliased:|Error)" || echo "Deployed"
cd "$SCRIPT_DIR"
echo ""

echo "=========================================="
echo "$(date '+%Y-%m-%d %H:%M:%S') Done! $SUMMARIES_GENERATED summaries generated, $ERRORS errors."
echo "Website: https://signal-summaries.vercel.app"
echo "=========================================="
