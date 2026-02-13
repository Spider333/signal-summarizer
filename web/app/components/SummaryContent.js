'use client'

import ReactMarkdown from 'react-markdown'
import TableOfContents from './TableOfContents'
import { HighlightButton, useHighlights } from './Highlights'
import { TopicHighlights } from './TopicTracker'

// Custom heading renderer that adds IDs for anchor links
const HeadingWithId = ({ level, children }) => {
  const text = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.map(c => typeof c === 'string' ? c : c?.props?.children || '').join('')
      : ''

  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const Tag = `h${level}`

  return (
    <Tag id={id} className="scroll-mt-20">
      {children}
    </Tag>
  )
}

// Extract TL;DR from content or generate key points
function extractTLDR(content) {
  // Look for existing TL;DR or key points section
  const tldrMatch = content.match(/(?:^|\n)(?:##?\s*)?(?:\*\*)?(?:TL;?DR|Key Points|Summary|Highlights)(?:\*\*)?:?\s*\n([\s\S]*?)(?=\n##|\n\*\*[A-Z]|$)/i)

  if (tldrMatch) {
    const points = tldrMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .slice(0, 5)
      .map(line => line.replace(/^[-•]\s*/, '').trim())

    if (points.length > 0) return points
  }

  // Extract first sentence from each major section as key points
  const sections = content.split(/^## \*\*/gm).filter(s => s.trim())
  const points = sections.slice(0, 5).map(section => {
    const lines = section.split('\n')
    const title = lines[0].replace(/\*\*/g, '').trim()
    // Get first meaningful sentence
    const firstPara = lines.slice(1).join(' ').trim()
    const firstSentence = firstPara.split(/[.!?]/)[0]?.trim()
    if (firstSentence && firstSentence.length > 20) {
      return `**${title}**: ${firstSentence.slice(0, 150)}${firstSentence.length > 150 ? '...' : ''}`
    }
    return `**${title}**`
  }).filter(Boolean)

  return points
}

export default function SummaryContent({ content, groupName, groupId }) {
  const { saveHighlight } = useHighlights()
  const tldrPoints = extractTLDR(content)

  return (
    <>
      <HighlightButton
        groupName={groupName}
        groupId={groupId}
        onSave={saveHighlight}
      />
      <TableOfContents content={content} />

      {/* Topic Highlights - Your tracked interests */}
      <TopicHighlights content={content} groupName={groupName} groupId={groupId} />

      {/* TL;DR Section */}
      {tldrPoints.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            TL;DR - Key Takeaways
          </h3>
          <ul className="space-y-2">
            {tldrPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-blue-900">
                <span className="text-blue-400 mt-1">•</span>
                <span dangerouslySetInnerHTML={{
                  __html: point.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                }} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="prose lg:pr-72">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <HeadingWithId level={1}>{children}</HeadingWithId>,
            h2: ({ children }) => <HeadingWithId level={2}>{children}</HeadingWithId>,
            h3: ({ children }) => <HeadingWithId level={3}>{children}</HeadingWithId>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Tip for highlighting */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
          </svg>
          <span>Tip: Select any text to save it to your highlights</span>
        </p>
      </div>
    </>
  )
}
