import { cookies } from 'next/headers'

// Use SHA-256 for secure hashing
async function sha256(message) {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Password hash - generated with: echo -n "pondelok" | shasum -a 256
// To change password: run `echo -n "newpassword" | shasum -a 256` in terminal
const PASSWORD_HASH = 'da1bd623f5b674bf924b286f789b63bb417a47a263b108581fe1dc8341f5d4dd'

// Session secret for signing tokens (change this!)
const SESSION_SECRET = process.env.SESSION_SECRET || 'signal-summaries-secret-change-me-in-production'

// Generate a secure session token
async function generateSessionToken() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2)
  const signature = await sha256(`${timestamp}:${random}:${SESSION_SECRET}`)
  return `${timestamp}:${random}:${signature}`
}

// Verify session token
async function verifySessionToken(token) {
  if (!token) return false

  const parts = token.split(':')
  if (parts.length !== 3) return false

  const [timestamp, random, signature] = parts
  const expectedSignature = await sha256(`${timestamp}:${random}:${SESSION_SECRET}`)

  if (signature !== expectedSignature) return false

  // Token expires after 7 days
  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

  return tokenAge < maxAge
}

export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 })
    }

    const inputHash = await sha256(password)

    if (inputHash !== PASSWORD_HASH) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500))
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Generate session token
    const sessionToken = await generateSessionToken()

    // Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return Response.json({ success: true })

  } catch (error) {
    console.error('Auth error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return Response.json({ authenticated: false })
    }

    const isValid = await verifySessionToken(sessionCookie.value)

    return Response.json({ authenticated: isValid })

  } catch (error) {
    console.error('Auth check error:', error)
    return Response.json({ authenticated: false })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')

    return Response.json({ success: true })

  } catch (error) {
    console.error('Logout error:', error)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
