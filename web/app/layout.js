import './globals.css'
import ClientLayout from './components/ClientLayout'

export const metadata = {
  title: 'Signal Group Summaries',
  description: 'AI-powered summaries of your Signal group conversations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
