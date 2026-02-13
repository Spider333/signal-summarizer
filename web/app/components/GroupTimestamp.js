'use client'

import { useState, useEffect } from 'react'

function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return null // Use full date instead
  } else if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'just now'
  }
}

function formatDateRange(startTs, endTs) {
  const start = new Date(startTs)
  const end = new Date(endTs)

  const formatShort = (date) => date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  const startStr = formatShort(start)
  const endStr = formatShort(end)

  // Same day
  if (startStr === endStr) {
    return endStr
  }

  return `${startStr} - ${endStr}`
}

export function GroupTimestamp({ group }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback for SSR or when new fields aren't available
  if (!group.lastTimestamp) {
    return (
      <p className="text-gray-500 text-sm">
        {group.messageCount} messages • Last updated: {group.lastUpdated}
      </p>
    )
  }

  if (!mounted) {
    // Server-side render
    return (
      <p className="text-gray-500 text-sm">
        {group.messageCount} messages • Last updated: {group.lastUpdated}
      </p>
    )
  }

  const relativeTime = getRelativeTime(group.lastTimestamp)
  const dateRange = group.dateRange
    ? formatDateRange(group.dateRange.startTimestamp, group.dateRange.endTimestamp)
    : null

  return (
    <p className="text-gray-500 text-sm">
      {group.messageCount} messages
      {dateRange && (
        <>
          {' • '}
          <span title="Date range of messages">
            {dateRange}
          </span>
        </>
      )}
      {' • '}
      <span
        className="cursor-help"
        title={new Date(group.lastTimestamp).toLocaleString()}
      >
        Updated {relativeTime || group.lastUpdated}
      </span>
    </p>
  )
}

export function GroupTimestampDetail({ group }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback for SSR or when new fields aren't available
  if (!group.lastTimestamp) {
    return (
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{group.messageCount} messages</span>
        <span>•</span>
        <span>Last updated: {group.lastUpdated}</span>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 text-sm text-gray-500">
        <span>{group.messageCount} messages</span>
        <span>•</span>
        <span>Last updated: {group.lastUpdated}</span>
      </div>
    )
  }

  const relativeTime = getRelativeTime(group.lastTimestamp)
  const dateRange = group.dateRange
    ? formatDateRange(group.dateRange.startTimestamp, group.dateRange.endTimestamp)
    : null

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
      <span>{group.messageCount} messages</span>
      {dateRange && (
        <>
          <span className="hidden sm:inline">•</span>
          <span title="Date range of messages in this summary">
            Period: {dateRange}
          </span>
        </>
      )}
      <span className="hidden sm:inline">•</span>
      <span
        className="cursor-help"
        title={new Date(group.lastTimestamp).toLocaleString()}
      >
        Updated {relativeTime || group.lastUpdatedFull || group.lastUpdated}
      </span>
    </div>
  )
}
