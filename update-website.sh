#!/bin/bash
set -e

cd /Users/davidstancel/dev/signal-summarizer/web

echo "Generating data from database..."
npm run generate

echo "Syncing Discord digest..."
npm run sync-discord

echo "Deploying to Vercel..."
vercel --prod --yes

echo "Done! Website updated."
