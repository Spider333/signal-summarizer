#!/bin/bash
cd /Users/davidstancel/dev/signal-summarizer
poetry run python summarize_signal_group.py "$@"
