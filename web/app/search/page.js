'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [searchIndex, setSearchIndex] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load search index and groups on mount
    Promise.all([
      fetch('/data/groups.json').then(res => res.json()),
      fetch('/data/search-index.json').then(res => res.json())
    ])
      .then(([groupsData, indexData]) => {
        setGroups(groupsData)
        setSearchIndex(indexData)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const results = useMemo(() => {
    if (!query.trim() || searchIndex.length === 0) {
      return []
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1)

    const matches = searchIndex
      .map(item => {
        const contentLower = item.content.toLowerCase()
        const titleLower = item.title.toLowerCase()

        let score = 0
        let matchedTerms = []

        searchTerms.forEach(term => {
          if (titleLower.includes(term)) {
            score += 10
            matchedTerms.push(term)
          }
          const contentMatches = (contentLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
          if (contentMatches > 0) {
            score += contentMatches
            matchedTerms.push(term)
          }
        })

        if (score === 0) return null

        // Extract snippet with context
        const snippets = []
        searchTerms.forEach(term => {
          const idx = contentLower.indexOf(term)
          if (idx !== -1) {
            const start = Math.max(0, idx - 80)
            const end = Math.min(item.content.length, idx + term.length + 80)
            let snippet = item.content.slice(start, end)
            if (start > 0) snippet = '...' + snippet
            if (end < item.content.length) snippet = snippet + '...'
            snippets.push(snippet)
          }
        })

        return {
          ...item,
          score,
          matchedTerms: [...new Set(matchedTerms)],
          snippet: snippets[0] || item.content.slice(0, 200) + '...'
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    return matches
  }, [query, searchIndex])

  const highlightText = (text, terms) => {
    if (!terms.length) return text
    try {
      const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi')
      const parts = text.split(regex)
      return parts.map((part, i) =>
        terms.some(t => part.toLowerCase() === t.toLowerCase())
          ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
          : part
      )
    } catch {
      return text
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to all groups
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Summaries</h1>
        <p className="text-gray-600">Find topics, people, and keywords across all your group summaries</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for topics, names, keywords..."
          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading search index...</div>
      ) : query.trim() && results.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">🔍</div>
          <p className="text-gray-500">No results found for "<span className="font-medium">{query}</span>"</p>
          <p className="text-gray-400 text-sm mt-2">Try different keywords or check spelling</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Found {results.length} result{results.length !== 1 ? 's' : ''} for "<span className="font-medium">{query}</span>"
          </p>
          {results.map((result, idx) => (
            <Link
              key={idx}
              href={`/group/${result.groupId}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <span className="inline-block text-xs text-blue-600 font-medium uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded">
                    {result.groupName}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-2">
                    {highlightText(result.title, result.matchedTerms)}
                  </h3>
                </div>
                <span className="text-gray-400 ml-4">→</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {highlightText(result.snippet, result.matchedTerms)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">🔎</div>
          <p className="text-lg">Search across {groups.length} group summaries</p>
          <p className="text-sm mt-2">Find discussions about specific topics, people, or keywords</p>
        </div>
      )}
    </main>
  )
}
