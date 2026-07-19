import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tracks } from '@/lib/db/schema'
import { enrichTrack } from '@/lib/metadata-enricher'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { trackId } = await request.json()

    const track = await db.query.tracks.findFirst({
      where: (t) => t.id === trackId && t.userId === userId,
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const enriched = await enrichTrack(track.title, track.artist, track.bpm)

    await db
      .update(tracks)
      .set({
        title: enriched.title,
        artist: enriched.artist,
        isrc: enriched.isrc,
        coverArt: enriched.coverArt,
        metadata: enriched.metadata,
        updatedAt: new Date(),
      })
      .where(eq(tracks.id, trackId))

    return NextResponse.json({ success: true, enriched })
  } catch (error) {
    console.error('[enrich] POST failed:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
