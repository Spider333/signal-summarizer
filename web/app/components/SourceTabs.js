import Link from 'next/link'

export function SourceTabs({ active }) {
  const tabs = [
    { id: 'signal', label: 'Signal', href: '/' },
    { id: 'discord', label: 'Discord (NS)', href: '/discord' },
  ]
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-1" aria-label="Source">
        {tabs.map((t) => {
          const isActive = t.id === active
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
