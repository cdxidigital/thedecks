import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tracks } from '@/lib/db/schema'
import { getSimilarTracks, getTrackInfo } from '@/lib/lastfm-client'
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
    const { trackId, limit = 5 } = await request.json()

    const track = await db.query.tracks.findFirst({
      where: (t) => t.id === trackId && t.userId === userId,
    })

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const userTracks = await db
      .select()
      .from(tracks)
      .where(eq(tracks.userId, userId))
      .limit(50)

    const similar = await getSimilarTracks(track.title, track.artist, 5)

    const recommendations = userTracks
      .filter((t) => {
        if (similar.length === 0) {
          return Math.abs((t.bpm || 120) - (track.bpm || 120)) < 10 || t.genre === track.genre
        }
        return similar.some(
          (s) => s.name.toLowerCase() === t.title.toLowerCase() && s.artist.name.toLowerCase() === t.artist.toLowerCase()
        )
      })
      .slice(0, limit)

    return NextResponse.json({
      recommendations: recommendations.length > 0 ? recommendations : userTracks.slice(0, limit),
      source: recommendations.length > 0 ? 'lastfm' : 'bpm_similarity',
    })
  } catch (error) {
    console.error('[recommendations] POST failed:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
