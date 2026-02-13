'use client'

import Link from 'next/link'
import { useHighlights, HighlightsPanel } from '../components/Highlights'

export default function NotesPage() {
  const { highlights, removeHighlight } = useHighlights()

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to all groups
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Highlights</h1>
          <p className="text-gray-600">Important quotes and information you've saved from summaries</p>
        </div>
        {highlights.length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {highlights.length} saved
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <HighlightsPanel highlights={highlights} onRemove={removeHighlight} />
      </div>
    </main>
  )
}
