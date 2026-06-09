import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import { SourceTabs } from '../components/SourceTabs'

function getDiscordFeed() {
  const dataPath = path.join(process.cwd(), 'data', 'discord-feed.json')
  if (!fs.existsSync(dataPath)) return null
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

export default function DiscordPage() {
  const feed = getDiscordFeed()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Summaries</h1>
        <p className="text-gray-400 text-xs mt-1">AI-powered digests of your communities</p>
      </div>

      <SourceTabs active="discord" />

      {!feed ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Discord digest yet</h2>
          <p className="text-gray-500">
            Run <code className="bg-gray-100 px-1.5 py-0.5 rounded">bash ~/dev/discord-digest/run-daily.sh</code> to generate the daily NS digest.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header card */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
                  {feed.server_name} — {feed.date}
                </h2>
                <p className="text-xs text-blue-700 mt-1">
                  {feed.total_messages.toLocaleString()} messages across {Object.keys(feed.channels).length} channels
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(feed.channels).map(([name, count]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-[11px] font-medium text-blue-700"
                  >
                    #{name}
                    <span className="text-blue-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Summary markdown */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <article className="prose prose-sm max-w-none prose-headings:mt-6 prose-headings:mb-3 prose-h1:hidden prose-h2:text-base prose-h2:font-bold prose-h2:text-gray-900 prose-p:text-sm prose-p:text-gray-700 prose-li:text-sm prose-li:text-gray-700 prose-a:text-blue-600 hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-pink-700 prose-code:bg-pink-50 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{feed.summary_markdown}</ReactMarkdown>
            </article>
          </section>
        </div>
      )}

      <footer className="mt-10 pt-6 border-t border-gray-100 text-center text-gray-300 text-xs">
        Powered by Claude AI — All processing happens locally
      </footer>
    </main>
  )
}
