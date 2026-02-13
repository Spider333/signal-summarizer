import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import TopicsPageClient from './TopicsPageClient'

function getGroups() {
  const dataPath = path.join(process.cwd(), 'data', 'groups.json')
  if (!fs.existsSync(dataPath)) {
    return []
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function getSummariesByGroup() {
  const groups = getGroups()
  const summariesDir = path.join(process.cwd(), 'data', 'summaries')
  const result = {}

  groups.forEach(group => {
    const summaryPath = path.join(summariesDir, `${group.id}.md`)
    if (fs.existsSync(summaryPath)) {
      result[group.id] = {
        groupName: group.name,
        content: fs.readFileSync(summaryPath, 'utf8'),
        // Include timestamp data for topics
        dateRange: group.dateRange,
        lastTimestamp: group.lastTimestamp,
        lastUpdated: group.lastUpdated
      }
    }
  })

  return result
}

export default function TopicsPage() {
  const summariesByGroup = getSummariesByGroup()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to all groups
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Topics</h1>
        <p className="text-gray-600">
          Information from your group conversations organized by topics you care about
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <TopicsPageClient summariesByGroup={summariesByGroup} />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tracked Topics</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>🇵🇾 <strong>Paraguay Residency</strong> - cedula, migraciones, RUC, visas</p>
          <p>🏢 <strong>US LLC & Taxes</strong> - incorporation, EIN, W-8BEN, IRS</p>
          <p>🌎 <strong>South America Living</strong> - Argentina, Uruguay, cost of living, expat life</p>
          <p>🤖 <strong>AI Tools</strong> - ChatGPT, Claude, Midjourney, automation</p>
          <p>🧳 <strong>Digital Nomad Tools</strong> - Wise, banking, insurance, remote work</p>
        </div>
      </div>
    </main>
  )
}
