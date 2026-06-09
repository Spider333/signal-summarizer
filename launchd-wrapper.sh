#!/bin/zsh
# Wrapper script for launchd signal-summarizer
# Uses explicit paths to avoid system Python 3.9 issues

export HOME="/Users/davidstancel"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NVM_DIR="$HOME/.nvm"

# Load nvm for node/npm/vercel
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

cd /Users/davidstancel/dev/signal-summarizer || {
    echo "$(date): FATAL — cannot cd to signal-summarizer repo" >&2
    exit 1
}

# Source environment
if [[ -f .env ]]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure poetry uses the right Python
export POETRY_VIRTUALENVS_IN_PROJECT=false

# Run the summarizer with explicit poetry path
/bin/bash ./auto-summarize.sh
