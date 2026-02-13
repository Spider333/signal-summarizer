import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import RefreshButton from './components/RefreshButton'
import { GroupTimestamp } from './components/GroupTimestamp'

function getGroups() {
  const dataPath = path.join(process.cwd(), 'data', 'groups.json')
  if (!fs.existsSync(dataPath)) {
    return []
  }
  const data = fs.readFileSync(dataPath, 'utf8')
  return JSON.parse(data)
}

function getTopicIndex() {
  const dataPath = path.join(process.cwd(), 'data', 'topic-index.json')
  if (!fs.existsSync(dataPath)) {
    return {}
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

const badgeClasses = {
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function Home() {
  const groups = getGroups()
  const topicIndex = getTopicIndex()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Signal Group Summaries</h1>
          <p className="text-gray-600">AI-powered summaries of your Signal conversations</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton />
          <Link
            href="/topics"
            className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded-lg px-4 py-2 text-purple-700 hover:bg-purple-100 hover:border-purple-400 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            My Topics
          </Link>
          <Link
            href="/notes"
            className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
            Notes
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No summaries yet</h2>
          <p className="text-gray-500">
            Run the summarizer to generate group summaries, then rebuild this site.
          </p>
          <pre className="mt-4 bg-gray-100 p-3 rounded text-sm text-left inline-block">
            ./summarize.sh --group GROUP_ID --last-week{'\n'}
            cd web && npm run generate && npm run build
          </pre>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/group/${group.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {group.name}
                  </h2>
                  <GroupTimestamp group={group} />
                  {group.description && (
                    <p className="text-gray-600 mt-2 text-sm">{group.description}</p>
                  )}
                  {topicIndex[group.id] && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(Array.isArray(topicIndex[group.id])
                        ? topicIndex[group.id]
                        : topicIndex[group.id].topics || []
                      ).slice(0, 4).map(topic => (
                        <span
                          key={topic.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeClasses[topic.color]}`}
                        >
                          {topic.icon} {topic.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-400 text-2xl ml-4">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Powered by Claude AI • Privacy-first: all processing happens locally</p>
      </footer>
    </main>
  )
}
