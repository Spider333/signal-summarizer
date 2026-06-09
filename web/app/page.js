import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import RefreshButton from './components/RefreshButton'
import { GroupTimestamp } from './components/GroupTimestamp'
import { HighlightsFeed } from './components/HighlightsFeed'
import { LinksGrid } from './components/LinksPanel'
import { SourceTabs } from './components/SourceTabs'

function getGroups() {
  const dataPath = path.join(process.cwd(), 'data', 'groups.json')
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function getHighlightsFeed() {
  const dataPath = path.join(process.cwd(), 'data', 'highlights-feed.json')
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function getLinksIndex() {
  const dataPath = path.join(process.cwd(), 'data', 'links-index.json')
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function getTLDR(highlights, links) {
  const items = []

  // Pick the top 3 most substantial themes (longest excerpts)
  const topThemes = [...highlights]
    .sort((a, b) => b.excerpt.length - a.excerpt.length)
    .slice(0, 3)

  topThemes.forEach(h => {
    // Get first sentence as bullet
    const firstSentence = h.excerpt.split(/[.!?]/)[0]?.trim()
    if (firstSentence && firstSentence.length > 30) {
      items.push({ text: firstSentence, group: h.groupName })
    }
  })

  // Add tool count
  if (links.length > 0) {
    const toolCount = links.filter(l => ['Tool', 'Repo', 'Model'].includes(l.category)).length
    if (toolCount > 0) {
      items.push({ text: `${toolCount} tools, repos & models shared across your groups`, group: null })
    }
  }

  return items
}

export default function Home() {
  const groups = getGroups()
  const highlights = getHighlightsFeed()
  const links = getLinksIndex()
  const tldr = getTLDR(highlights, links)

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Summaries</h1>
          <p className="text-gray-400 text-xs mt-1">AI-powered digests of your communities</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton />
          <Link
            href="/search"
            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Link>
        </div>
      </div>

      <SourceTabs active="signal" />

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No summaries yet</h2>
          <p className="text-gray-500">Run <code>./refresh.sh</code> to generate summaries.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* TL;DR — What should I look at? */}
          {tldr.length > 0 && (
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">What to know</h2>
              <ul className="space-y-2">
                {tldr.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-900">
                    <span className="text-blue-400 mt-0.5 font-bold">-</span>
                    <span>
                      {item.text}
                      {item.group && <span className="text-blue-500 text-xs ml-1.5">({item.group})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tools & Links — THE key feature */}
          {links.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Tools & Links</h2>
                {links.length > 6 && (
                  <Link href="/links" className="text-xs text-blue-600 hover:underline">
                    All {links.length} →
                  </Link>
                )}
              </div>
              <LinksGrid links={links} showGroup={true} limit={6} />
            </section>
          )}

          {/* What's Being Discussed */}
          {highlights.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-3">Discussions</h2>
              <HighlightsFeed highlights={highlights} limit={5} />
            </section>
          )}

          {/* Groups */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Groups</h2>
            <div className="grid gap-2">
              {groups.map((group) => {
                const preview = highlights.find(h => h.groupId === group.id)
                return (
                  <Link
                    key={group.id}
                    href={`/group/${group.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{group.name}</h3>
                        {!group.hasSummary && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">no summary</span>
                        )}
                      </div>
                      <GroupTimestamp group={group} />
                      {preview && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{preview.theme}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      )}

      <footer className="mt-10 pt-6 border-t border-gray-100 text-center text-gray-300 text-xs">
        Powered by Claude AI — All processing happens locally
      </footer>
    </main>
  )
}
