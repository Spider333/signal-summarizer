'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

// Parse summary into structured themes
function parseThemes(content) {
  const sections = content.split(/^## \*\*/gm).filter(s => s.trim())
  const themes = []

  sections.forEach(section => {
    const lines = section.split('\n')
    const title = lines[0].replace(/\*\*/g, '').trim()
    const body = lines.slice(1).join('\n').trim()
    if (!body) return

    // Skip the links section (handled separately)
    if (title.toLowerCase().includes('links shared')) return

    // Extract dissenting opinions
    const dissentMatch = body.match(/\*\*Dissenting opinions:\*\*\s*([\s\S]*)/)
    const mainBody = dissentMatch ? body.slice(0, dissentMatch.index).trim() : body
    const dissent = dissentMatch ? dissentMatch[1].trim() : null

    // Excerpt for collapsed view
    const excerpt = mainBody.slice(0, 180)

    themes.push({ title, body: mainBody, dissent, excerpt })
  })

  return themes
}

function ThemeCard({ theme, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
      >
        <svg
          className={`w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{theme.title}</h3>
          {!isOpen && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{theme.excerpt}...</p>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="prose prose-sm mt-3 max-w-none">
            <ReactMarkdown>{theme.body}</ReactMarkdown>
          </div>
          {theme.dissent && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Dissenting views</p>
              <p className="text-xs text-amber-800 leading-relaxed">{theme.dissent}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SummaryContent({ content, groupName, groupId }) {
  const themes = parseThemes(content)

  if (themes.length > 0) {
    return (
      <div className="space-y-3">
        {themes.map((theme, idx) => (
          <ThemeCard key={idx} theme={theme} defaultOpen={idx === 0} />
        ))}
      </div>
    )
  }

  // Fallback: raw markdown
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
