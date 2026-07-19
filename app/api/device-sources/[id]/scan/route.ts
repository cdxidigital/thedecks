import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deviceSources, tracks } from '@/lib/db/schema'
import { enrichTrack } from '@/lib/metadata-enricher'
import { parseFile } from 'music-metadata'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function POST(
  request: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  try {
    const userId = await getUserId()

    const source = await db.query.deviceSources.findFirst({
      where: (ds) => ds.id === id && ds.userId === userId,
    })

    if (!source) {
      return NextResponse.json({ error: 'Device source not found' }, { status: 404 })
    }

    const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma', '.aiff']

    const foundTracks = []

    try {
      const response = await fetch(source.path)
      if (!response.ok) throw new Error(`Failed to access ${source.path}`)

      const files = [] // Placeholder: real implementation would scan directory

      for (const file of files) {
        if (!audioExtensions.some((ext) => file.toLowerCase().endsWith(ext))) continue

        try {
          const metadata = await parseFile(file)
          const enriched = await enrichTrack(metadata.common?.title || 'Unknown', metadata.common?.artist || 'Unknown', metadata.format?.bitrate)

          const newTrack = await db
            .insert(tracks)
            .values({
              userId,
              title: enriched.title,
              artist: enriched.artist,
              fileName: file.split('/').pop() || 'track',
              contentType: `audio/${file.split('.').pop()}`,
              size: 0,
              duration: metadata.format?.duration,
              bpm: (metadata.common as any)?.bpm,
              musicalKey: metadata.common?.key,
              isrc: enriched.isrc,
              coverArt: enriched.coverArt,
              metadata: enriched.metadata,
              deviceSourceId: id,
              localPath: file,
            })

          foundTracks.push(newTrack)
        } catch (err) {
          console.error(`[scan] Failed to parse ${file}:`, err)
        }
      }
    } catch (err) {
      console.error('[scan] Failed to access device source:', err)
    }

    await db
      .update(deviceSources)
      .set({ lastScanned: new Date() })
      .where(eq(deviceSources.id, id))

    return NextResponse.json({
      success: true,
      scanned: foundTracks.length,
      tracks: foundTracks,
    })
  } catch (error) {
    console.error('[scan] POST failed:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
