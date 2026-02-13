'use client'

import PasswordGate from './PasswordGate'

export default function ClientLayout({ children }) {
  return <PasswordGate>{children}</PasswordGate>
}
