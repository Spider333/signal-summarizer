#!/bin/bash
#
# Signal Summaries — one-command refresh
# Usage: ./refresh.sh [--no-deploy]
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VENV_PY="/Users/davidstancel/Library/Caches/pypoetry/virtualenvs/signal-summarizer-Y55dha3X-py3.11/bin/python"
EXPORT_DIR="$SCRIPT_DIR/signal-export-requested"

echo "=== Signal Summaries Refresh ==="
echo ""

# Step 1: Export fresh messages from Signal Desktop
echo "[1/4] Exporting messages from Signal Desktop..."
sigexport --overwrite "$EXPORT_DIR" 2>&1 | tail -3
echo "     Done."

# Step 2: Import into SQLite DB
echo "[2/4] Importing messages into database..."
$VENV_PY -c "
import import_from_export, os
import_from_export.EXPORT_DIR = '$EXPORT_DIR'
import_from_export.main()
"
echo "     Done."

# Step 3: Summarize configured groups
echo "[3/4] Running AI summarizer on groups..."
source "$SCRIPT_DIR/.env" && export ANTHROPIC_API_KEY

# Groups to summarize (imported ID → output file)
declare -A GROUPS
GROUPS["imported_AICZSK"]="summary_ai_czsk.md"
GROUPS["imported_AIxFEYTOPIA"]="summary_ai_feytopia.md"
GROUPS["ldjHsasu9CUpEuugaWd1UOJcr4E1Q8YMY2MeBMtptq8="]="summary_global_opportunists.md"
GROUPS["tGW5zEDHutJE/YuTOynuWjRQHHugj+EjMOqumvSklMI="]="summary_paraguajski_fesaci.md"

for GROUP_ID in "${!GROUPS[@]}"; do
    OUTPUT="${GROUPS[$GROUP_ID]}"
    echo "     Summarizing → $OUTPUT"
    $VENV_PY summarize_signal_group.py --group "$GROUP_ID" --last-month --output "$OUTPUT" 2>&1 | grep -E "^Summary|ERROR" || true
done
echo "     Done."

# Step 4: Build website and deploy
echo "[4/4] Building website..."
cd "$SCRIPT_DIR/web"
npm run generate 2>&1 | grep -E "Generated|links|highlights|groups"
npm run build 2>&1 | tail -3

if [ "$1" != "--no-deploy" ]; then
    echo "     Deploying to Vercel..."
    vercel --prod --yes 2>&1 | grep -E "Aliased|Error"
fi

echo ""
echo "=== Done! ==="
echo "Site: https://signal-summaries.vercel.app"
