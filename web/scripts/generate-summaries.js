#!/usr/bin/env node

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const DB_PATH = process.env.SIGNAL_DB || path.join(__dirname, '../../messages.db')
const CONFIG_PATH = process.env.SIGNAL_CONFIG || path.join(__dirname, '../../config.json')
const OUTPUT_DIR = path.join(__dirname, '../data')
const SUMMARIES_DIR = path.join(OUTPUT_DIR, 'summaries')

// Ensure output directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true })
fs.mkdirSync(SUMMARIES_DIR, { recursive: true })

// Load config for group descriptions
let config = { groups: {} }
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
} catch (e) {
  console.log('Could not load config.json, using defaults')
}

// Connect to database
let db
try {
  db = new Database(DB_PATH, { readonly: true })
} catch (e) {
  console.error(`Could not open database at ${DB_PATH}`)
  console.error('Make sure messages have been collected first.')

  // Write empty groups file
  fs.writeFileSync(path.join(OUTPUT_DIR, 'groups.json'), JSON.stringify([]))
  process.exit(0)
}

// Map group IDs to their summary files and display names
// Groups are matched by name (case-insensitive) if ID not found
const ALLOWED_GROUPS = {
  // Your requested groups (will be populated by live collector)
  'paraguajskí fešáci': {
    summaryFile: 'summary_paraguajski_fesaci.md',
    displayName: 'Paraguajskí fešáci'
  },
  'skoro paraguajskí fešáci': {
    summaryFile: 'summary_skoro_paraguajski_fesaci.md',
    displayName: 'Skoro paraguajskí fešáci'
  },
  'global opportunists': {
    summaryFile: 'summary_global_opportunists.md',
    displayName: 'Global Opportunists'
  },
  'bitcoin kyc&tax sk/cz chat': {
    summaryFile: 'summary_bitcoin_kyc_tax.md',
    displayName: 'Bitcoin KYC & Tax SK/CZ'
  },
  'llc': {
    summaryFile: 'summary_llc.md',
    displayName: 'LLC'
  },
  'solo bog + tbc concept customers': {
    summaryFile: 'summary_solo_bog.md',
    displayName: 'Solo BoG'
  },
  'liberationtravel\'s announcements': {
    summaryFile: 'summary_liberation_travel.md',
    displayName: 'Liberation Travel Announcements'
  },
  // Additional groups with existing data
  'imported_AIxFEYTOPIA': {
    summaryFile: 'summary_ai_feytopia.md',
    displayName: 'AI x FEYTOPIA'
  },
  'aixfeytopia': {
    summaryFile: 'summary_ai_feytopia.md',
    displayName: 'AI x FEYTOPIA'
  },
}

// Get all groups with message counts - only include explicitly allowed groups
const groups = db.prepare(`
  SELECT
    groupId as id,
    groupName as name,
    COUNT(*) as messageCount,
    MIN(timestamp) as firstTimestamp,
    MAX(timestamp) as lastTimestamp
  FROM messages
  WHERE groupId IS NOT NULL
  GROUP BY groupId
  ORDER BY lastTimestamp DESC
`).all().filter(g => {
  // Match by group ID or by group name (case-insensitive)
  const nameLower = (g.name || '').toLowerCase()
  return g.id in ALLOWED_GROUPS || nameLower in ALLOWED_GROUPS
})

// Scan for all existing summary files in the parent directory
const summaryDir = path.join(__dirname, '..', '..')
const allSummaryFiles = fs.readdirSync(summaryDir).filter(f => f.startsWith('summary') && f.endsWith('.md'))
console.log(`Found ${allSummaryFiles.length} summary files: ${allSummaryFiles.join(', ')}`)

// Format groups for the web app
const formattedGroups = groups.map(group => {
  const groupConfig = Object.entries(config.groups || {}).find(([id]) => id === group.id)?.[1] || {}

  // Create a safe ID for filenames (base64 has special chars)
  const safeId = Buffer.from(group.id).toString('hex')

  // Get allowed group config (by ID or name)
  const nameLower = (group.name || '').toLowerCase()
  const allowedConfig = ALLOWED_GROUPS[group.id] || ALLOWED_GROUPS[nameLower] || {}

  // Check if summary file exists - try multiple patterns
  const possibleFiles = [
    allowedConfig.summaryFile, // Try direct mapping first
    groupConfig.output_file,
    `summary_${safeId}.md`,
    `summary_${group.name}.md`,
    `summary_${group.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}.md`,
    // Also check for partial matches
    ...allSummaryFiles.filter(f =>
      f.toLowerCase().includes(group.name?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'xxxx')
    )
  ].filter(Boolean)

  let summary = null
  let foundFile = null
  for (const file of possibleFiles) {
    const summaryPath = path.join(summaryDir, file)
    if (fs.existsSync(summaryPath)) {
      summary = fs.readFileSync(summaryPath, 'utf8')
      foundFile = file
      // Copy summary to web data dir
      fs.writeFileSync(path.join(SUMMARIES_DIR, `${safeId}.md`), summary)
      break
    }
  }

  // Format timestamps with full date and time
  const lastDate = new Date(group.lastTimestamp)
  const firstDate = new Date(group.firstTimestamp)

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const formatDateTime = (date) => date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  return {
    id: safeId,
    originalId: group.id,
    name: allowedConfig.displayName || group.name || 'Unknown Group',
    description: groupConfig.group_description || '',
    messageCount: group.messageCount,
    // Keep simple date for backwards compatibility
    lastUpdated: formatDate(lastDate),
    // Add detailed timestamp info
    lastTimestamp: group.lastTimestamp,
    lastUpdatedFull: formatDateTime(lastDate),
    firstTimestamp: group.firstTimestamp,
    dateRange: {
      start: formatDate(firstDate),
      end: formatDate(lastDate),
      startTimestamp: group.firstTimestamp,
      endTimestamp: group.lastTimestamp
    },
    hasSummary: !!summary,
    summaryFile: foundFile
  }
})

// Write groups index
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'groups.json'),
  JSON.stringify(formattedGroups, null, 2)
)

// Generate search index
const searchIndex = []
formattedGroups.forEach(group => {
  const summaryPath = path.join(SUMMARIES_DIR, `${group.id}.md`)
  if (!fs.existsSync(summaryPath)) return

  const content = fs.readFileSync(summaryPath, 'utf8')

  // Split by headers to create searchable sections
  const sections = content.split(/^## \*\*/gm)

  sections.forEach((section, idx) => {
    if (!section.trim()) return

    // Extract title from first line
    const lines = section.split('\n')
    let title = lines[0].replace(/\*\*/g, '').trim()
    if (idx === 0 && !title.startsWith('#')) {
      title = 'Overview'
    }

    const sectionContent = lines.slice(1).join('\n').trim()
    if (!sectionContent) return

    searchIndex.push({
      groupId: group.id,
      groupName: group.name,
      title: title,
      content: sectionContent,
    })
  })
})

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'search-index.json'),
  JSON.stringify(searchIndex, null, 2)
)

// Generate topic index for each group
const TRACKED_TOPICS = {
  'paraguay-residency': {
    name: 'Paraguay Residency',
    icon: '🇵🇾',
    color: 'red',
    keywords: ['paraguay', 'residency', 'residencia', 'cedula', 'migraciones', 'asuncion', 'paraguayan', 'permanent resident', 'temporary resident', 'visa paraguay', 'ruc', 'paraguajsk']
  },
  'us-llc-taxes': {
    name: 'US LLC & Taxes',
    icon: '🏢',
    color: 'blue',
    keywords: ['llc', 'us llc', 'wyoming', 'delaware', 'new mexico', 'irs', 'ein', 'itin', 'w-8ben', 'tax', 'taxes', 'incorporation', 'registered agent', '5472', 'fbar', 'fatca', 'cfc', 'gilti', 'pass-through', 'disregarded entity', 'single member']
  },
  'south-america-living': {
    name: 'South America Living',
    icon: '🌎',
    color: 'green',
    keywords: ['argentina', 'uruguay', 'montevideo', 'buenos aires', 'mendoza', 'cordoba', 'chile', 'santiago', 'brazil', 'colombia', 'medellin', 'cost of living', 'expat', 'south america', 'latin america', 'latam']
  },
  'ai-tools': {
    name: 'AI Tools',
    icon: '🤖',
    color: 'purple',
    keywords: ['chatgpt', 'claude', 'gpt-4', 'gpt4', 'openai', 'anthropic', 'midjourney', 'stable diffusion', 'dall-e', 'ai tool', 'llm', 'machine learning', 'automation', 'cursor', 'copilot', 'gemini', 'perplexity', 'ai agent']
  },
  'nomad-tools': {
    name: 'Nomad Tools',
    icon: '🧳',
    color: 'orange',
    keywords: ['nomad', 'remote work', 'coworking', 'coliving', 'wise', 'transferwise', 'revolut', 'mercury', 'relay', 'stripe atlas', 'firstbase', 'travel insurance', 'safetywing', 'vpn', 'esim', 'airalo', 'starlink', 'banking', 'freelance']
  }
}

const topicIndex = {}
formattedGroups.forEach(group => {
  const summaryPath = path.join(SUMMARIES_DIR, `${group.id}.md`)
  if (!fs.existsSync(summaryPath)) return

  const content = fs.readFileSync(summaryPath, 'utf8').toLowerCase()
  const foundTopics = []

  Object.entries(TRACKED_TOPICS).forEach(([id, topic]) => {
    const matchCount = topic.keywords.reduce((count, kw) => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
      return count + (content.match(regex) || []).length
    }, 0)
    if (matchCount > 0) {
      foundTopics.push({ id, ...topic, matchCount })
    }
  })

  if (foundTopics.length > 0) {
    topicIndex[group.id] = {
      topics: foundTopics.sort((a, b) => b.matchCount - a.matchCount),
      // Include group timestamp data for topic date context
      dateRange: group.dateRange,
      lastTimestamp: group.lastTimestamp,
      lastUpdated: group.lastUpdated
    }
  }
})

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'topic-index.json'),
  JSON.stringify(topicIndex, null, 2)
)

console.log(`Generated topic index for ${Object.keys(topicIndex).length} groups`)

console.log(`Generated data for ${formattedGroups.length} groups`)
console.log(`Generated search index with ${searchIndex.length} sections`)
formattedGroups.forEach(g => {
  console.log(`  - ${g.name}: ${g.messageCount} messages${g.hasSummary ? ' (has summary)' : ''}`)
})

db.close()
