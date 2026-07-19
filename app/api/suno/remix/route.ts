import { NextResponse } from 'next/server'

type RemixRequest = {
  track?: {
    title?: unknown
    artist?: unknown
    bpm?: unknown
    key?: unknown
  }
  genre?: unknown
  direction?: unknown
  intensity?: unknown
  arrangement?: unknown
  rightsConfirmed?: unknown
}

type SunoCandidate = {
  id?: unknown
  title?: unknown
  status?: unknown
  duration?: unknown
  image_url?: unknown
  image_large_url?: unknown
  audio_url?: unknown
  video_url?: unknown
}

const allowedGenres = new Set(['UK Garage', 'Afro House', 'Drum & Bass', 'Melodic Techno'])
const allowedDirections = new Set(['Underground club', 'Festival peak', 'Late-night minimal', 'Radio edit'])
const allowedArrangement = new Set(['Keep vocals', 'Extend intro', 'Club outro'])

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function safeUrl(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let body: RemixRequest

  try {
    body = (await request.json()) as RemixRequest
  } catch {
    return NextResponse.json({ error: 'The remix request is not valid JSON.' }, { status: 400 })
  }

  const title = cleanText(body.track?.title, 100)
  const artist = cleanText(body.track?.artist, 100)
  const bpm = typeof body.track?.bpm === 'number' ? body.track.bpm : Number.NaN
  const key = cleanText(body.track?.key, 12)
  const genre = cleanText(body.genre, 40)
  const direction = cleanText(body.direction, 40)
  const intensity = typeof body.intensity === 'number' ? Math.round(body.intensity) : Number.NaN
  const arrangement = Array.isArray(body.arrangement)
    ? body.arrangement.filter((item): item is string => typeof item === 'string' && allowedArrangement.has(item))
    : []

  if (!body.rightsConfirmed) {
    return NextResponse.json({ error: 'Confirm that you control the required music rights.' }, { status: 400 })
  }

  if (!title || !artist || !Number.isFinite(bpm) || bpm < 40 || bpm > 240 || !key) {
    return NextResponse.json({ error: 'The selected track metadata is incomplete.' }, { status: 400 })
  }

  if (!allowedGenres.has(genre) || !allowedDirections.has(direction) || !Number.isFinite(intensity) || intensity < 0 || intensity > 100) {
    return NextResponse.json({ error: 'Choose valid remix settings and try again.' }, { status: 400 })
  }

  const baseUrl = process.env.SUNO_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!baseUrl) {
    return NextResponse.json({ error: 'Suno remix generation is not configured. Add SUNO_API_BASE_URL to the project.' }, { status: 503 })
  }

  try {
    const parsedBaseUrl = new URL(baseUrl)
    if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) throw new Error('Invalid protocol')
  } catch {
    return NextResponse.json({ error: 'SUNO_API_BASE_URL is not a valid HTTP URL.' }, { status: 503 })
  }

  const prompt = [
    `Create a new ${genre} track inspired by the musical metadata of “${title}” by ${artist}.`,
    `Aim for ${Math.round(bpm)} BPM, compatible with Camelot key ${key}, with a ${direction.toLowerCase()} character.`,
    `Creative intensity: ${intensity} percent.`,
    arrangement.length ? `Arrangement direction: ${arrangement.join(', ').toLowerCase()}.` : '',
    'Compose an original interpretation rather than copying the source recording, melody, lyrics, or artist identity.',
    'Deliver a polished, DJ-friendly arrangement with a clear intro, evolving main section, and controlled low end.',
  ].filter(Boolean).join(' ')

  try {
    const upstream = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        make_instrumental: !arrangement.includes('Keep vocals'),
        wait_audio: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(180_000),
    })

    const payload: unknown = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      const upstreamError = payload && typeof payload === 'object' && 'error' in payload
        ? cleanText((payload as { error?: unknown }).error, 240)
        : ''
      return NextResponse.json(
        { error: upstreamError || `The Suno service returned status ${upstream.status}.` },
        { status: upstream.status === 402 ? 402 : 502 },
      )
    }

    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: 'The Suno service returned an unexpected response.' }, { status: 502 })
    }

    const candidates = payload.slice(0, 4).map((item: SunoCandidate, index) => ({
      id: cleanText(item.id, 120) || `candidate-${index + 1}`,
      title: cleanText(item.title, 120) || `${title} · ${genre} interpretation ${index + 1}`,
      status: cleanText(item.status, 40) || 'complete',
      duration: typeof item.duration === 'number' && Number.isFinite(item.duration) ? item.duration : null,
      artworkUrl: safeUrl(item.image_large_url) || safeUrl(item.image_url),
      audioUrl: safeUrl(item.audio_url) || safeUrl(item.video_url),
    }))

    if (!candidates.length) {
      return NextResponse.json({ error: 'Suno did not return any remix candidates.' }, { status: 502 })
    }

    return NextResponse.json({ candidates })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return NextResponse.json({ error: 'Suno took too long to generate the track. Please retry.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Could not connect to the configured Suno service.' }, { status: 502 })
  }
}
