'use client'

const categoryConfig = {
  Repo: { icon: '📦', bg: 'bg-gray-100', text: 'text-gray-700' },
  Model: { icon: '🧠', bg: 'bg-purple-100', text: 'text-purple-700' },
  Research: { icon: '📄', bg: 'bg-blue-100', text: 'text-blue-700' },
  Tool: { icon: '🔧', bg: 'bg-green-100', text: 'text-green-700' },
  Video: { icon: '🎬', bg: 'bg-red-100', text: 'text-red-700' },
  Article: { icon: '📰', bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

function LinkCard({ link, showGroup = false }) {
  const cat = categoryConfig[link.category] || categoryConfig.Article
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${cat.bg} text-sm flex-shrink-0`}>
          {cat.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {link.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {link.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cat.bg} ${cat.text}`}>
              {link.category}
            </span>
            {showGroup && (
              <span className="text-[10px] text-gray-400">{link.groupName}</span>
            )}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

export function LinksGrid({ links, showGroup = true, limit }) {
  const displayed = limit ? links.slice(0, limit) : links
  if (displayed.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {displayed.map((link, idx) => (
        <LinkCard key={idx} link={link} showGroup={showGroup} />
      ))}
    </div>
  )
}

export function LinksSidebar({ links }) {
  if (links.length === 0) return null

  return (
    <div className="space-y-2">
      {links.map((link, idx) => {
        const cat = categoryConfig[link.category] || categoryConfig.Article
        return (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className="text-sm">{cat.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 line-clamp-1">{link.title}</p>
              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{link.description}</p>
            </div>
          </a>
        )
      })}
    </div>
  )
}
