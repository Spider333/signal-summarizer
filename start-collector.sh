#!/bin/bash
#
# Start the Signal message collector (foreground).
# Used by launchd daemon — KeepAlive restarts on exit.
#

cd /Users/davidstancel/dev/signal-message-processor || exit 1

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/davidstancel"

VENV_PYTHON="/Users/davidstancel/Library/Caches/pypoetry/virtualenvs/signal-message-processor-mTovnFmT-py3.9/bin/python"

exec "$VENV_PYTHON" signal_message_processor.py --log-level INFO
