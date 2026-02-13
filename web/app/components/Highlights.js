'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'signal-summaries-highlights'

export function useHighlights() {
  const [highlights, setHighlights] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setHighlights(JSON.parse(stored))
    }
  }, [])

  const saveHighlight = useCallback((highlight) => {
    setHighlights(prev => {
      const updated = [...prev, { ...highlight, id: Date.now(), createdAt: new Date().toISOString() }]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeHighlight = useCallback((id) => {
    setHighlights(prev => {
      const updated = prev.filter(h => h.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return { highlights, saveHighlight, removeHighlight }
}

export function HighlightButton({ groupName, groupId, onSave }) {
  const [selection, setSelection] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showButton, setShowButton] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection()
      const text = sel.toString().trim()

      if (text.length > 10 && text.length < 1000) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelection(text)
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY
        })
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    const handleClick = (e) => {
      if (!e.target.closest('.highlight-btn')) {
        setShowButton(false)
      }
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  const handleSave = () => {
    if (selection) {
      onSave({
        text: selection,
        groupName,
        groupId
      })
      setShowButton(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      window.getSelection().removeAllRanges()
    }
  }

  return (
    <>
      {showButton && (
        <button
          onClick={handleSave}
          className="highlight-btn fixed z-50 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-1.5 transform -translate-x-1/2 -translate-y-full transition-all"
          style={{ left: position.x, top: position.y }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
          Save highlight
        </button>
      )}

      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved to your highlights
        </div>
      )}
    </>
  )
}

export function HighlightsPanel({ highlights, onRemove }) {
  if (highlights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No highlights yet</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Select any text in a summary and click "Save highlight" to save important quotes and information here.
        </p>
      </div>
    )
  }

  // Group by date
  const grouped = highlights.reduce((acc, h) => {
    const date = new Date(h.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(h)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {Object.entries(grouped).reverse().map(([date, items]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
          <div className="space-y-3">
            {items.map((highlight) => (
              <div
                key={highlight.id}
                className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed">"{highlight.text}"</p>
                    <p className="text-sm text-gray-500 mt-2">
                      From <span className="font-medium">{highlight.groupName}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(highlight.id)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove highlight"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
