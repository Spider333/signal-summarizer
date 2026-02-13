'use client'

import { useState, useEffect } from 'react'

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Extract headings from markdown content
    const regex = /^##\s+\*\*(.+?)\*\*|^##\s+(.+?)$/gm
    const matches = []
    let match

    while ((match = regex.exec(content)) !== null) {
      const text = match[1] || match[2]
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      matches.push({ id, text })
    }

    setHeadings(matches)
  }, [content])

  useEffect(() => {
    // Observe which section is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  const scrollTo = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setIsOpen(false)
    }
  }

  if (headings.length < 2) return null

  return (
    <>
      {/* Mobile: Floating button + dropdown */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Table of contents"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-16 right-0 w-72 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contents</h3>
              <nav className="space-y-1">
                {headings.map(({ id, text }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                      activeId === id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:block fixed top-24 right-8 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Contents</h3>
          <nav className="space-y-1">
            {headings.map(({ id, text }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                  activeId === id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {text}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
