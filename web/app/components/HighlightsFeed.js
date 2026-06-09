import Link from 'next/link'

export function HighlightsFeed({ highlights, limit = 8 }) {
  const displayed = highlights.slice(0, limit)
  if (displayed.length === 0) return null

  return (
    <div className="space-y-3">
      {displayed.map((item, idx) => (
        <Link
          key={idx}
          href={`/group/${item.groupId}`}
          className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch bg-blue-400 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.theme}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.excerpt}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600">
                  {item.groupName}
                </span>
                <span className="text-[10px] text-gray-400">{item.lastUpdated}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
