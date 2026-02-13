'use client'

import { useState, useEffect } from 'react'

// Calculate relative time string
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
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else {
    return 'just now'
  }
}

// Format a timestamp for display
export function formatTimestamp(timestamp, options = {}) {
  const date = new Date(timestamp)
  const { includeTime = true, relative = true } = options

  if (relative) {
    const relativeStr = getRelativeTime(timestamp)
    if (relativeStr) return relativeStr
  }

  if (includeTime) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Client component for relative time display
export function RelativeTime({ timestamp, fallback, includeTime = true, className = '' }) {
  const [displayText, setDisplayText] = useState(fallback)

  useEffect(() => {
    // Update immediately
    setDisplayText(formatTimestamp(timestamp, { includeTime, relative: true }))

    // Update every minute for relative times
    const interval = setInterval(() => {
      setDisplayText(formatTimestamp(timestamp, { includeTime, relative: true }))
    }, 60000)

    return () => clearInterval(interval)
  }, [timestamp, includeTime])

  return <span className={className} title={new Date(timestamp).toLocaleString()}>{displayText}</span>
}

// Display a date range
export function DateRange({ start, end, startTimestamp, endTimestamp, className = '' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Format dates consistently
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatYear = (timestamp) => {
    return new Date(timestamp).getFullYear()
  }

  if (!mounted) {
    // Server-side render with provided strings
    return <span className={className}>{start} - {end}</span>
  }

  const startStr = formatDate(startTimestamp)
  const endStr = formatDate(endTimestamp)
  const startYear = formatYear(startTimestamp)
  const endYear = formatYear(endTimestamp)

  // If same day, show just that day
  if (startStr === endStr) {
    return <span className={className}>{endStr}, {endYear}</span>
  }

  // If same year, don't repeat it
  if (startYear === endYear) {
    return <span className={className}>{startStr} - {endStr}, {endYear}</span>
  }

  // Different years
  return <span className={className}>{start} - {end}</span>
}
