import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import SummaryContent from '../../components/SummaryContent'
import { GroupTimestampDetail } from '../../components/GroupTimestamp'
import { LinksGrid } from '../../components/LinksPanel'

function getGroups() {
  const dataPath = path.join(process.cwd(), 'data', 'groups.json')
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

function getSummary(id) {
  const summaryPath = path.join(process.cwd(), 'data', 'summaries', `${id}.md`)
  if (!fs.existsSync(summaryPath)) return null
  return fs.readFileSync(summaryPath, 'utf8')
}

function getLinksForGroup(groupId) {
  const dataPath = path.join(process.cwd(), 'data', 'links-index.json')
  if (!fs.existsSync(dataPath)) return []
  const all = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  return all.filter(l => l.groupId === groupId)
}

export async function generateStaticParams() {
  const groups = getGroups()
  return groups.map((group) => ({ id: group.id }))
}

export default async function GroupPage({ params }) {
  const { id } = await params
  const groups = getGroups()
  const group = groups.find(g => g.id === id)
  const summary = getSummary(id)
  const links = getLinksForGroup(id)

  if (!group) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Group not found</h1>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">← Back</Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back</Link>

      {/* Group header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{group.name}</h1>
        <GroupTimestampDetail group={group} />
        {group.description && (
          <p className="text-gray-500 mt-2 text-sm">{group.description}</p>
        )}
      </div>

      {/* Links & Tools — FIRST, above summary */}
      {links.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Links & Tools ({links.length})
          </h2>
          <LinksGrid links={links} showGroup={false} />
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">Discussion Summary</h2>
        {summary ? (
          <SummaryContent content={summary} groupName={group.name} groupId={group.id} />
        ) : (
          <p className="text-gray-400 italic text-sm">No summary yet. Run the summarizer for this group.</p>
        )}
      </div>
    </main>
  )
}
