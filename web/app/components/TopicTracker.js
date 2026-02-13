'use client'

import { useMemo } from 'react'
import Link from 'next/link'

// Your interest topics with keywords to match
export const TRACKED_TOPICS = {
  'paraguay-residency': {
    name: 'Paraguay Residency',
    icon: '🇵🇾',
    color: 'red',
    keywords: [
      'paraguay', 'residency', 'residencia', 'cedula', 'migraciones',
      'asuncion', 'paraguayan', 'permanent resident', 'temporary resident',
      'visa paraguay', 'ruc', 'paraguajsk'
    ]
  },
  'us-llc-taxes': {
    name: 'US LLC & Taxes',
    icon: '🏢',
    color: 'blue',
    keywords: [
      'llc', 'us llc', 'wyoming', 'delaware', 'new mexico', 'irs',
      'ein', 'itin', 'w-8ben', 'tax', 'taxes', 'incorporation',
      'registered agent', '5472', 'fbar', 'fatca', 'cfc', 'gilti',
      'pass-through', 'disregarded entity', 'single member'
    ]
  },
  'south-america-living': {
    name: 'Living in South America',
    icon: '🌎',
    color: 'green',
    keywords: [
      'argentina', 'uruguay', 'montevideo', 'buenos aires', 'mendoza',
      'cordoba', 'chile', 'santiago', 'brazil', 'colombia', 'medellin',
      'cost of living', 'expat', 'nomad', 'coliving', 'coworking',
      'south america', 'latin america', 'latam'
    ]
  },
  'ai-tools': {
    name: 'AI Tools & Tech',
    icon: '🤖',
    color: 'purple',
    keywords: [
      'chatgpt', 'claude', 'gpt-4', 'gpt4', 'openai', 'anthropic',
      'midjourney', 'stable diffusion', 'dall-e', 'ai tool', 'llm',
      'machine learning', 'automation', 'cursor', 'copilot', 'gemini',
      'perplexity', 'ai agent', 'langchain', 'vector', 'embedding',
      'rag', 'fine-tune', 'prompt'
    ]
  },
  'nomad-tools': {
    name: 'Digital Nomad Tools',
    icon: '🧳',
    color: 'orange',
    keywords: [
      'nomad', 'remote work', 'coworking', 'coliving', 'wise', 'transferwise',
      'revolut', 'mercury', 'relay', 'stripe atlas', 'firstbase',
      'travel insurance', 'safetywing', 'world nomads', 'vpn', 'esim',
      'airalo', 'starlink', 'notion', 'slack', 'zoom', 'loom',
      'banking', 'international', 'freelance', 'contractor'
    ]
  }
}

const colorClasses = {
  red: 'bg-red-50 border-red-200 text-red-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
}

const badgeClasses = {
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

export function extractTopicsFromContent(content) {
  const contentLower = content.toLowerCase()
  const found = {}

  Object.entries(TRACKED_TOPICS).forEach(([id, topic]) => {
    const matches = []
    topic.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      let match
      while ((match = regex.exec(contentLower)) !== null) {
        // Get surrounding context
        const start = Math.max(0, match.index - 100)
        const end = Math.min(content.length, match.index + keyword.length + 100)
        let snippet = content.slice(start, end).trim()
        if (start > 0) snippet = '...' + snippet
        if (end < content.length) snippet = snippet + '...'

        matches.push({
          keyword,
          snippet,
          index: match.index
        })
      }
    })

    if (matches.length > 0) {
      // Deduplicate by removing overlapping snippets
      const uniqueMatches = matches.reduce((acc, match) => {
        const isDuplicate = acc.some(m =>
          Math.abs(m.index - match.index) < 50
        )
        if (!isDuplicate) acc.push(match)
        return acc
      }, [])

      found[id] = {
        ...topic,
        matches: uniqueMatches.slice(0, 5) // Max 5 matches per topic
      }
    }
  })

  return found
}

export function TopicBadges({ topics }) {
  const topicIds = Object.keys(topics)
  if (topicIds.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {topicIds.map(id => {
        const topic = topics[id]
        return (
          <span
            key={id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeClasses[topic.color]}`}
          >
            {topic.icon} {topic.name}
            <span className="opacity-60">({topic.matches.length})</span>
          </span>
        )
      })}
    </div>
  )
}

export function TopicHighlights({ content, groupName, groupId }) {
  const topics = useMemo(() => extractTopicsFromContent(content), [content])
  const topicIds = Object.keys(topics)

  if (topicIds.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Topics You're Tracking
      </h3>
      <div className="grid gap-3">
        {topicIds.map(id => {
          const topic = topics[id]
          return (
            <details
              key={id}
              className={`border rounded-lg overflow-hidden ${colorClasses[topic.color]}`}
            >
              <summary className="px-4 py-3 cursor-pointer hover:bg-white/50 transition-colors flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  {topic.icon} {topic.name}
                </span>
                <span className="text-sm opacity-70">
                  {topic.matches.length} mention{topic.matches.length !== 1 ? 's' : ''}
                </span>
              </summary>
              <div className="px-4 pb-4 pt-2 bg-white/50 space-y-2">
                {topic.matches.map((match, idx) => (
                  <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                    "{match.snippet}"
                  </p>
                ))}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

function formatDateRange(dateRange) {
  if (!dateRange) return null

  const start = new Date(dateRange.startTimestamp)
  const end = new Date(dateRange.endTimestamp)

  const formatShort = (date) => date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  const startStr = formatShort(start)
  const endStr = formatShort(end)

  // Same day
  if (startStr === endStr) {
    return endStr
  }

  return `${startStr} - ${endStr}`
}

export function TopicsOverview({ summariesByGroup }) {
  // Aggregate all topics across all groups
  const allTopics = useMemo(() => {
    const aggregated = {}

    Object.entries(summariesByGroup).forEach(([groupId, { groupName, content, dateRange, lastTimestamp, lastUpdated }]) => {
      const topics = extractTopicsFromContent(content)

      Object.entries(topics).forEach(([topicId, topic]) => {
        if (!aggregated[topicId]) {
          aggregated[topicId] = {
            ...topic,
            groups: [],
            totalMatches: 0,
            // Track the most recent timestamp for this topic
            latestTimestamp: 0
          }
        }
        aggregated[topicId].groups.push({
          groupId,
          groupName,
          matchCount: topic.matches.length,
          matches: topic.matches,
          dateRange,
          lastTimestamp,
          lastUpdated
        })
        aggregated[topicId].totalMatches += topic.matches.length

        // Update latest timestamp if this group is more recent
        if (lastTimestamp && lastTimestamp > aggregated[topicId].latestTimestamp) {
          aggregated[topicId].latestTimestamp = lastTimestamp
        }
      })
    })

    return aggregated
  }, [summariesByGroup])

  const topicIds = Object.keys(allTopics).sort(
    (a, b) => allTopics[b].totalMatches - allTopics[a].totalMatches
  )

  if (topicIds.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-5xl mb-4">🔍</div>
        <p>No tracked topics found in your summaries yet.</p>
        <p className="text-sm mt-2">Topics will appear here as your groups discuss them.</p>
      </div>
    )
  }

  // Sort topics by most recent activity
  const sortedTopicIds = [...topicIds].sort(
    (a, b) => allTopics[b].latestTimestamp - allTopics[a].latestTimestamp
  )

  return (
    <div className="space-y-6">
      {sortedTopicIds.map(topicId => {
        const topic = allTopics[topicId]
        const latestDate = topic.latestTimestamp
          ? new Date(topic.latestTimestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : null
        return (
          <div
            key={topicId}
            className={`border rounded-lg overflow-hidden ${colorClasses[topic.color]}`}
          >
            <div className="px-5 py-4 border-b border-current/10">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {topic.icon} {topic.name}
                </h3>
                {latestDate && (
                  <span className="text-xs opacity-60 bg-white/50 px-2 py-1 rounded">
                    Latest: {latestDate}
                  </span>
                )}
              </div>
              <p className="text-sm opacity-70 mt-1">
                {topic.totalMatches} mentions across {topic.groups.length} group{topic.groups.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/50 divide-y divide-current/10">
              {topic.groups
                .sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
                .map(group => {
                  const groupDateRange = formatDateRange(group.dateRange)
                  return (
                    <div key={group.groupId} className="px-5 py-4">
                      <Link
                        href={`/group/${group.groupId}`}
                        className="font-medium hover:underline flex items-center justify-between"
                      >
                        <span>{group.groupName}</span>
                        <span className="text-sm opacity-60">{group.matchCount} mentions →</span>
                      </Link>
                      {groupDateRange && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          From: {groupDateRange}
                        </p>
                      )}
                      <div className="mt-2 space-y-2">
                        {group.matches.slice(0, 2).map((match, idx) => (
                          <p key={idx} className="text-sm text-gray-600 leading-relaxed">
                            "{match.snippet}"
                          </p>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
