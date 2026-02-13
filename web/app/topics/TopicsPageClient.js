'use client'

import { TopicsOverview } from '../components/TopicTracker'

export default function TopicsPageClient({ summariesByGroup }) {
  return <TopicsOverview summariesByGroup={summariesByGroup} />
}
