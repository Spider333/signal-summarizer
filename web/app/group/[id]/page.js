import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import SummaryContent from '../../components/SummaryContent'
import { GroupTimestampDetail } from '../../components/GroupTimestamp'

function getGroups() {
  const dataPath = path.join(process.cwd(), 'data', 'groups.json')
  if (!fs.existsSync(dataPath)) {
    return []
  }
  const data = fs.readFileSync(dataPath, 'utf8')
  return JSON.parse(data)
}

function getSummary(id) {
  const summaryPath = path.join(process.cwd(), 'data', 'summaries', `${id}.md`)
  if (!fs.existsSync(summaryPath)) {
    return null
  }
  return fs.readFileSync(summaryPath, 'utf8')
}

export async function generateStaticParams() {
  const groups = getGroups()
  return groups.map((group) => ({
    id: group.id,
  }))
}

export default async function GroupPage({ params }) {
  const { id } = await params
  const groups = getGroups()
  const group = groups.find(g => g.id === id)
  const summary = getSummary(id)

  if (!group) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Group not found</h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to groups
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-blue-600 hover:underline text-sm">
          ← Back to all groups
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search all
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
        <GroupTimestampDetail group={group} />
        {group.description && (
          <p className="text-gray-600 mt-3">{group.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 relative">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Summary</h2>
        {summary ? (
          <SummaryContent content={summary} groupName={group.name} groupId={group.id} />
        ) : (
          <p className="text-gray-500 italic">No summary available yet. Run the summarizer for this group.</p>
        )}
      </div>
    </main>
  )
}
