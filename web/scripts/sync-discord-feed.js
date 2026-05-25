#!/usr/bin/env node
// Pull the latest Discord digest JSON from ~/dev/discord-digest into web/data/discord-feed.json
// Falls back to the most recent dated digest if latest.json is missing.

const fs = require('fs')
const path = require('path')
const os = require('os')

const DIGEST_DIR = path.join(os.homedir(), 'dev', 'discord-digest', 'digests')
const OUTPUT = path.join(__dirname, '..', 'data', 'discord-feed.json')

function findLatestDigestJson() {
  const direct = path.join(DIGEST_DIR, 'latest.json')
  if (fs.existsSync(direct)) return direct

  if (!fs.existsSync(DIGEST_DIR)) return null

  const dated = fs
    .readdirSync(DIGEST_DIR)
    .filter((f) => /^digest-\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse()
  if (dated.length === 0) return null

  // No latest.json — synthesize one from the markdown digest
  const md = fs.readFileSync(path.join(DIGEST_DIR, dated[0]), 'utf8')
  const date = dated[0].match(/digest-(\d{4}-\d{2}-\d{2})\.md/)[1]
  const statsPath = path.join(DIGEST_DIR, `stats-${date}.json`)
  const stats = fs.existsSync(statsPath)
    ? JSON.parse(fs.readFileSync(statsPath, 'utf8'))
    : { date, total_messages: 0, channels: {} }

  return {
    synthesized: true,
    payload: {
      date: stats.date,
      server_name: 'Network School',
      total_messages: stats.total_messages,
      channels: stats.channels,
      summary_markdown: md,
    },
  }
}

function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  const found = findLatestDigestJson()

  if (!found) {
    console.log('No Discord digest found — writing empty placeholder.')
    fs.writeFileSync(
      OUTPUT,
      JSON.stringify({
        date: null,
        server_name: 'Network School',
        total_messages: 0,
        channels: {},
        summary_markdown: 'No digest available yet.',
      }, null, 2)
    )
    return
  }

  if (typeof found === 'string') {
    fs.copyFileSync(found, OUTPUT)
    console.log(`Discord feed synced from ${found}`)
  } else {
    fs.writeFileSync(OUTPUT, JSON.stringify(found.payload, null, 2))
    console.log(`Discord feed synthesized from latest markdown digest (${found.payload.date})`)
  }
}

main()
