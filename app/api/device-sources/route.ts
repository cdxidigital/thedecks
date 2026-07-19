import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deviceSources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function GET() {
  try {
    const userId = await getUserId()
    const sources = await db.select().from(deviceSources).where(eq(deviceSources.userId, userId))
    return NextResponse.json(sources)
  } catch (error) {
    console.error('[device-sources] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { type, path, label } = await request.json()

    if (!['local_folder', 'smb_share', 'nfs_share'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const source = await db.insert(deviceSources).values({
      userId,
      type,
      path,
      label: label || path,
      enabled: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[device-sources] POST failed:', error)
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 })
  }
}
