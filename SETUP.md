# Signal Summarizer - Complete Setup Documentation

This document contains everything you need to know about your automated Signal group summarization system.

**Website:** https://signal-summaries.vercel.app
**Vercel Project:** stanceldavid/signal-summaries
**GitHub Repo:** /Users/davidstancel/dev/signal-summarizer

---

## Table of Contents
1. [How It Works](#how-it-works)
2. [Website Features](#website-features)
3. [Permissions & Security](#permissions--security)
4. [Cron Jobs](#cron-jobs)
5. [Deployment](#deployment)
6. [Monitored Groups](#monitored-groups)
7. [Tracked Topics](#tracked-topics)
8. [Directory Structure](#directory-structure)
9. [Manual Commands](#manual-commands)
10. [Logs](#logs)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)

---

## How It Works

### Architecture Overview

```
┌─────────────────┐      ┌─────────────┐      ┌──────────────────────────┐
│ Signal Desktop  │ ←──→ │  signal-cli │ ───→ │ signal-message-processor │
│ (your messages) │      │  (linked)   │      │ (collects to database)   │
└─────────────────┘      └─────────────┘      └──────────────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │   messages.db    │
                                               │ (SQLite database)│
                                               └──────────────────┘
                                                          │
                              ┌────────────────────────────────────────────┐
                              │         auto-summarize.sh (hourly)         │
                              │  1. Check for new messages                 │
                              │  2. Call Claude Sonnet API                 │
                              │  3. Generate summary_*.md files            │
                              │  4. Update website data                    │
                              │  5. Deploy to Vercel                       │
                              └────────────────────────────────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │  Next.js Website │
                                               │ signal-summaries │
                                               │   .vercel.app    │
                                               └──────────────────┘
```

### Data Flow

1. **Message Collection**: `signal-cli` receives messages from Signal servers (linked to your phone +421911738272)
2. **Storage**: `signal-message-processor` saves messages to SQLite database (`messages.db`)
3. **Summarization**: `auto-summarize.sh` sends messages to Claude Sonnet API for summarization
4. **Website Generation**: `generate-summaries.js` creates JSON data for the website
5. **Deployment**: Vercel CLI deploys the static site to https://signal-summaries.vercel.app

### What Gets Sent to Anthropic

- Only the **text content** of messages from monitored groups
- Sender names (as they appear in Signal)
- Message timestamps
- **NOT sent**: Attachments, images, audio files (processed locally if enabled)

---

## Website Features

The website at https://signal-summaries.vercel.app includes several features to help you quickly understand and navigate your summaries.

### Homepage

| Feature | Description |
|---------|-------------|
| Group Cards | Click any group to view its summary |
| Topic Badges | Shows detected topics (Paraguay, AI Tools, etc.) on each group |
| My Topics | Navigate to tracked topic dashboard |
| Notes | View your saved highlights |
| Search | Search across all summaries |

### Summary Page Features

#### Table of Contents
- **Desktop**: Fixed sidebar on the right side showing all sections
- **Mobile**: Floating button that opens a dropdown menu
- Smooth scroll to sections when clicked
- Active section is highlighted as you scroll

#### TL;DR Section
- Appears at the top of each summary in a blue box
- Extracts key takeaways automatically from the summary
- Shows up to 5 bullet points of the most important info

#### Highlight & Save Quotes
1. Select any text in the summary
2. A yellow "Save Highlight" button appears
3. Click to save the quote to your Notes
4. Access all saved highlights at `/notes`
5. Highlights are stored in your browser (localStorage)

#### Topic Highlights
- Purple box showing topics detected in this specific summary
- Shows matched keywords and context snippets
- Click "View all topics" to see aggregated topic data

### Search Page (`/search`)

- Full-text search across all group summaries
- Results show matching sections with context
- Click any result to jump to that group's summary

### My Topics Page (`/topics`)

- Dashboard showing all tracked topics
- Aggregated mentions across all groups
- Click any topic to see which groups mention it
- Shows keyword matches and relevant snippets

### Notes Page (`/notes`)

- View all your saved highlights
- Organized by date saved
- Shows source group for each highlight
- Delete highlights you no longer need

### File Locations

| Component | File |
|-----------|------|
| Homepage | `web/app/page.js` |
| Group Summary Page | `web/app/group/[id]/page.js` |
| Search Page | `web/app/search/page.js` |
| Topics Page | `web/app/topics/page.js` |
| Notes Page | `web/app/notes/page.js` |
| Table of Contents | `web/app/components/TableOfContents.js` |
| Summary Content | `web/app/components/SummaryContent.js` |
| Highlights System | `web/app/components/Highlights.js` |
| Topic Tracker | `web/app/components/TopicTracker.js` |

---

## Permissions & Security

### Signal Access - READ ONLY

The system uses a **read-only wrapper** that blocks all send operations:

**File:** `/Users/davidstancel/dev/signal-summarizer/signal-cli-readonly`

```bash
# Blocked commands (cannot send anything):
send, sendReaction, sendReceipt, sendTyping, sendContacts,
sendSyncRequest, sendPaymentNotification, updateProfile,
updateGroup, updateContact, joinGroup, quitGroup, block,
unblock, setPin, removePin, trust, remoteDelete
```

**This means the tool CAN:**
- ✅ Receive messages
- ✅ Read group information
- ✅ Access message history (while collector is running)

**This means the tool CANNOT:**
- ❌ Send messages to anyone
- ❌ React to messages
- ❌ Modify your profile
- ❌ Join/leave groups
- ❌ Block/unblock contacts

### API Key Storage

| Secret | Location | Notes |
|--------|----------|-------|
| ANTHROPIC_API_KEY | `/Users/davidstancel/dev/signal-summarizer/.env` | Not in git |
| Vercel Token | `~/.config/vercel/auth.json` | Managed by Vercel CLI |
| Signal credentials | `~/.local/share/signal-cli/` | Managed by signal-cli |

### What Runs on Your Machine

| Process | Runs As | Access |
|---------|---------|--------|
| signal-cli | Your user | Signal account (read-only via wrapper) |
| signal-message-processor | Your user | Local filesystem, SQLite |
| auto-summarize.sh | Your user (via cron) | Local filesystem, Anthropic API, Vercel |
| Vercel CLI | Your user | Vercel account (stanceldavid) |

### Network Connections

| Destination | Purpose | Data Sent |
|-------------|---------|-----------|
| Signal servers | Receive messages | Encrypted Signal protocol |
| api.anthropic.com | Claude Sonnet API | Message text for summarization |
| vercel.com | Website deployment | Static HTML/CSS/JS files |

---

## Cron Jobs

### Current Cron Configuration

View with: `crontab -l`

```cron
# Signal group summarizer - runs every hour
0 * * * * /Users/davidstancel/dev/signal-summarizer/auto-summarize.sh >> /Users/davidstancel/dev/signal-summarizer/cron.log 2>&1
```

### What This Means

- **Schedule:** `0 * * * *` = Every hour at minute :00 (1:00, 2:00, 3:00, etc.)
- **Script:** `/Users/davidstancel/dev/signal-summarizer/auto-summarize.sh`
- **Output:** Appended to `/Users/davidstancel/dev/signal-summarizer/cron.log`

### What the Cron Job Does (Step by Step)

1. **Starts collector if not running** - Calls `start-collector-bg.sh`
2. **Queries database** - Finds groups with messages in last 3 days
3. **For each monitored group with messages:**
   - Extracts messages from SQLite
   - Sends to Claude Sonnet for summarization
   - Saves result to `summary_*.md`
4. **Updates website** - Runs `npm run generate` in web directory
5. **Deploys** - Runs `vercel --prod --yes`

### Modify Cron Schedule

```bash
crontab -e
```

Common schedules:
| Schedule | Cron Expression |
|----------|-----------------|
| Every hour | `0 * * * *` |
| Every 30 minutes | `*/30 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Daily at 9am | `0 9 * * *` |
| Daily at midnight | `0 0 * * *` |

---

## Deployment

### Where the Website is Deployed

| Property | Value |
|----------|-------|
| **URL** | https://signal-summaries.vercel.app |
| **Platform** | Vercel |
| **Account** | stanceldavid |
| **Project Name** | signal-summaries |
| **Framework** | Next.js 16 (Static Export) |

### Deployment Process

The cron job runs this automatically:
```bash
cd /Users/davidstancel/dev/signal-summarizer/web
npm run generate    # Creates data/groups.json and data/summaries/*.md
vercel --prod --yes # Deploys to production
```

### Manual Deployment

```bash
cd /Users/davidstancel/dev/signal-summarizer/web
npm run generate
vercel --prod --yes
```

### Vercel Configuration

- **Build Command:** `npm run build` (runs `next build`)
- **Output Directory:** Auto-detected by Vercel
- **Node Version:** 18.x

### Check Deployment Status

```bash
vercel ls                    # List recent deployments
vercel inspect <url> --logs  # View build logs
```

---

## Monitored Groups

These groups are configured for summarization:

| Group Name | Summary File | Display Name |
|------------|--------------|--------------|
| Paraguajskí fešáci | summary_paraguajski_fesaci.md | Paraguajskí fešáci |
| Skoro paraguajskí fešáci | summary_skoro_paraguajski_fesaci.md | Skoro paraguajskí fešáci |
| Global Opportunists | summary_global_opportunists.md | Global Opportunists |
| Bitcoin KYC&Tax SK/CZ chat | summary_bitcoin_kyc_tax.md | Bitcoin KYC & Tax |
| LLC | summary_llc.md | LLC |
| SOLO BoG + TBC Concept | summary_solo_bog.md | Solo BoG |
| LiberationTravel's Announcements | summary_liberation_travel.md | Liberation Travel |
| AIxFEYTOPIA | summary_ai_feytopia.md | AI x FEYTOPIA |

### Add a New Group

1. Edit `auto-summarize.sh` - add line:
   ```bash
   summarize_group "Group Name" "summary_filename.md" "Display Name" && true || SUMMARIES_GENERATED=$((SUMMARIES_GENERATED + 1))
   ```

2. Edit `web/scripts/generate-summaries.js` - add to ALLOWED_GROUPS:
   ```javascript
   'group name lowercase': {
     summaryFile: 'summary_filename.md',
     displayName: 'Display Name'
   },
   ```

### Remove a Group

1. Remove the `summarize_group` line from `auto-summarize.sh`
2. Remove the entry from `ALLOWED_GROUPS` in `generate-summaries.js`

---

## Tracked Topics

The system automatically detects and highlights specific topics you're interested in. Topics are matched by keywords in the summary content.

### Currently Tracked Topics

| Topic | Icon | Color | Keywords |
|-------|------|-------|----------|
| Paraguay Residency | 🇵🇾 | Red | paraguay, residency, residencia, cedula, migraciones, asuncion, paraguayan, permanent resident, temporary resident, visa paraguay, ruc, paraguajsk |
| US LLC & Taxes | 🏢 | Blue | llc, us llc, wyoming, delaware, new mexico, irs, ein, itin, w-8ben, tax, taxes, incorporation, registered agent, 5472, fbar, fatca, cfc, gilti, pass-through, disregarded entity, single member |
| South America Living | 🌎 | Green | argentina, uruguay, montevideo, buenos aires, mendoza, cordoba, chile, santiago, brazil, colombia, medellin, cost of living, expat, south america, latin america, latam |
| AI Tools | 🤖 | Purple | chatgpt, claude, gpt-4, gpt4, openai, anthropic, midjourney, stable diffusion, dall-e, ai tool, llm, machine learning, automation, cursor, copilot, gemini, perplexity, ai agent |
| Nomad Tools | 🧳 | Orange | nomad, remote work, coworking, coliving, wise, transferwise, revolut, mercury, relay, stripe atlas, firstbase, travel insurance, safetywing, vpn, esim, airalo, starlink, banking, freelance |

### How Topic Tracking Works

1. **During generate step**: `npm run generate` scans all summaries
2. **Keyword matching**: Each topic's keywords are searched in the content
3. **Match counting**: Topics are ranked by number of keyword matches
4. **Index creation**: Results saved to `web/data/topic-index.json`

### Add a New Topic

Edit `web/scripts/generate-summaries.js` and add to `TRACKED_TOPICS`:

```javascript
'my-new-topic': {
  name: 'My New Topic',
  icon: '🎯',
  color: 'blue',  // red, blue, green, purple, or orange
  keywords: ['keyword1', 'keyword2', 'keyword3']
}
```

Then regenerate: `cd web && npm run generate`

### Modify Topic Keywords

1. Open `web/scripts/generate-summaries.js`
2. Find the topic in `TRACKED_TOPICS`
3. Add or remove keywords from the array
4. Regenerate: `cd web && npm run generate`

### Remove a Topic

1. Delete the topic entry from `TRACKED_TOPICS` in `generate-summaries.js`
2. Regenerate: `cd web && npm run generate`

### Topic Display Locations

| Location | What Shows |
|----------|------------|
| Homepage | Up to 4 topic badges per group card |
| Summary Page | Topic Highlights box with matched keywords |
| `/topics` Page | Full dashboard of all topics across all groups |

### Files for Topic Tracking

| File | Purpose |
|------|---------|
| `web/scripts/generate-summaries.js` | Defines `TRACKED_TOPICS` and generates index |
| `web/data/topic-index.json` | Generated topic index (per group) |
| `web/app/components/TopicTracker.js` | UI components for displaying topics |
| `web/app/topics/page.js` | Topics dashboard page |

---

## Directory Structure

```
/Users/davidstancel/dev/signal-summarizer/
│
├── SETUP.md                    # THIS FILE - complete documentation
├── README.md                   # Original project readme
│
├── auto-summarize.sh           # 🔄 Main automation script (runs hourly)
├── start-collector-bg.sh       # 🔄 Starts message collector in background
├── signal-cli-readonly         # 🔒 Read-only wrapper for signal-cli
│
├── .env                        # 🔑 ANTHROPIC_API_KEY (not in git)
├── config.json                 # ⚙️ Summarizer configuration
├── messages.db                 # 💾 SQLite database with messages
│
├── summary_*.md                # 📝 Generated summaries
├── collector.log               # 📋 Message collector output
├── collector.pid               # 📋 PID file for collector process
├── cron.log                    # 📋 Hourly cron job output
│
├── web/                        # 🌐 Next.js website
│   ├── package.json
│   ├── next.config.js
│   ├── app/                    # Next.js app router pages
│   │   ├── page.js             # Homepage
│   │   ├── search/page.js      # Search page
│   │   ├── topics/page.js      # Topics dashboard
│   │   ├── notes/page.js       # Saved highlights
│   │   ├── group/[id]/page.js  # Group summary page
│   │   └── components/         # Reusable components
│   │       ├── TableOfContents.js
│   │       ├── SummaryContent.js
│   │       ├── Highlights.js
│   │       └── TopicTracker.js
│   ├── data/
│   │   ├── groups.json         # Generated group list
│   │   ├── search-index.json   # Search index for all summaries
│   │   ├── topic-index.json    # Topic matches per group
│   │   └── summaries/          # Summary files served to website
│   └── scripts/
│       └── generate-summaries.js  # Generates all data files
│
└── signal-message-processor/   # (separate repo)
    ├── signal_message_processor.py
    └── config.json
```

---

## Manual Commands

### Message Collector

```bash
# Check if running
ps aux | grep signal_message_processor | grep -v grep

# Start collector
cd /Users/davidstancel/dev/signal-summarizer
./start-collector-bg.sh

# Stop collector
kill $(cat /Users/davidstancel/dev/signal-summarizer/collector.pid)

# View collector logs
tail -f /Users/davidstancel/dev/signal-summarizer/collector.log
```

### Summarizer

```bash
cd /Users/davidstancel/dev/signal-summarizer

# Run full automation (default: last 3 days)
./auto-summarize.sh

# Run with custom lookback period
./auto-summarize.sh 7    # Last 7 days

# Summarize specific group manually
poetry run python summarize_signal_group.py \
  --group "GROUP_ID" \
  --since "2026-02-01" \
  --output "summary_name.md"

# List all groups in database
sqlite3 messages.db "SELECT groupName, COUNT(*) FROM messages WHERE groupId IS NOT NULL GROUP BY groupId ORDER BY COUNT(*) DESC;"
```

### Website

```bash
cd /Users/davidstancel/dev/signal-summarizer/web

# Regenerate data
npm run generate

# Deploy to Vercel
vercel --prod --yes

# Local development
npm run dev
```

### Signal-CLI

```bash
# Check linked status
signal-cli -a +421911738272 listGroups

# Receive pending messages (collector does this automatically)
signal-cli -a +421911738272 receive
```

---

## Logs

| Log File | Location | Purpose |
|----------|----------|---------|
| collector.log | `/Users/davidstancel/dev/signal-summarizer/collector.log` | Messages received by collector |
| cron.log | `/Users/davidstancel/dev/signal-summarizer/cron.log` | Hourly job output |
| collector-error.log | `/Users/davidstancel/dev/signal-summarizer/collector-error.log` | Collector errors |

### View Logs

```bash
# Recent collector activity
tail -50 /Users/davidstancel/dev/signal-summarizer/collector.log

# Recent cron runs
tail -100 /Users/davidstancel/dev/signal-summarizer/cron.log

# Follow collector in real-time
tail -f /Users/davidstancel/dev/signal-summarizer/collector.log
```

---

## Configuration

### Main Config: `config.json`

Key settings:
- **Model:** Claude Sonnet (`claude-sonnet-4-20250514`)
- **Provider:** Anthropic
- **Language:** English
- **Vision/Audio:** Disabled (would require Ollama)

### Environment: `.env`

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Website Config: `web/scripts/generate-summaries.js`

Controls which groups appear on website via `ALLOWED_GROUPS` object.

---

## Troubleshooting

### No summaries generated

1. Check collector is running:
   ```bash
   ps aux | grep signal_message_processor
   ```

2. Check messages exist:
   ```bash
   sqlite3 /Users/davidstancel/dev/signal-summarizer/messages.db \
     "SELECT COUNT(*) FROM messages;"
   ```

3. Check cron log:
   ```bash
   tail -50 /Users/davidstancel/dev/signal-summarizer/cron.log
   ```

### Collector not starting

1. Check error log:
   ```bash
   cat /Users/davidstancel/dev/signal-summarizer/collector-error.log
   ```

2. Start manually:
   ```bash
   ./start-collector-bg.sh
   ```

3. Verify signal-cli is linked:
   ```bash
   signal-cli -a +421911738272 listGroups
   ```

### Website not updating

1. Check Vercel auth:
   ```bash
   vercel whoami
   ```

2. Deploy manually:
   ```bash
   cd web && npm run generate && vercel --prod --yes
   ```

### Missing messages from groups

The collector only captures messages received **while it's running**. Historical messages cannot be imported because Signal Desktop uses SQLCipher encryption that signal-export cannot decrypt.

**Solution:** Keep the collector running continuously. The cron job will restart it if it stops.

### API errors

Check your Anthropic API key:
```bash
cat /Users/davidstancel/dev/signal-summarizer/.env
```

Test API access:
```bash
curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/models
```

---

## Quick Reference Card

| Task | Command |
|------|---------|
| View website | https://signal-summaries.vercel.app |
| View saved highlights | https://signal-summaries.vercel.app/notes |
| View topics dashboard | https://signal-summaries.vercel.app/topics |
| Search summaries | https://signal-summaries.vercel.app/search |
| Check collector | `ps aux \| grep signal_message` |
| Start collector | `./start-collector-bg.sh` |
| Run summarizer | `./auto-summarize.sh` |
| View cron log | `tail -50 cron.log` |
| View collector log | `tail -50 collector.log` |
| Edit cron schedule | `crontab -e` |
| Manual deploy | `cd web && npm run generate && vercel --prod --yes` |
| Local dev server | `cd web && npm run dev` |
| Add tracked topic | Edit `TRACKED_TOPICS` in `web/scripts/generate-summaries.js` |
| List groups in DB | `sqlite3 messages.db "SELECT groupName, COUNT(*) FROM messages GROUP BY groupId;"` |
