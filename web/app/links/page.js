import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { LinksGrid } from '../components/LinksPanel'

function getLinksIndex() {
  const dataPath = path.join(process.cwd(), 'data', 'links-index.json')
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
}

export default function LinksPage() {
  const links = getLinksIndex()

  // Group by category
  const categories = {}
  links.forEach(link => {
    if (!categories[link.category]) categories[link.category] = []
    categories[link.category].push(link)
  })

  const categoryOrder = ['Tool', 'Repo', 'Model', 'Research', 'Article', 'Video']

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">All Links & Tools</h1>
        <p className="text-gray-500 text-sm">{links.length} links shared across your Signal groups</p>
      </div>

      <div className="space-y-8">
        {categoryOrder.map(cat => {
          const catLinks = categories[cat]
          if (!catLinks || catLinks.length === 0) return null
          return (
            <section key={cat}>
              <h2 className="text-base font-bold text-gray-800 mb-3">{cat}s ({catLinks.length})</h2>
              <LinksGrid links={catLinks} showGroup={true} />
            </section>
          )
        })}
      </div>
    </main>
  )
}
