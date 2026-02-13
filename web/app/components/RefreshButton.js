'use client'

import { useState } from 'react'

export default function RefreshButton() {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const command = 'cd ~/Documents/GitHub/signal-summarizer && ./auto-summarize.sh'

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      setShowTooltip(true)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => !copied && setShowTooltip(false)}
        className={`flex items-center gap-2 border rounded-lg px-4 py-2 transition-colors shadow-sm ${
          copied
            ? 'bg-green-50 border-green-300 text-green-700'
            : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400'
        }`}
        title="Copy refresh command to clipboard"
      >
        {copied ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </>
        )}
      </button>

      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
          <div className="font-medium mb-1">Run in Terminal:</div>
          <code className="bg-gray-800 px-2 py-1 rounded block">{command}</code>
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  )
}
