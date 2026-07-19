# Suno API Integration Guide

This document explains how to integrate a Suno API instance with The Decks remix workflow.

---

## What is Suno API?

Suno API is a wrapper around the Suno AI music generation service. It allows programmatic generation of original music based on text prompts, style controls, and metadata.

Two popular implementations:
- **[gcui-art/suno-api](https://github.com/gcui-art/suno-api)** — Node.js wrapper
- **[Suno-API/Suno-API](https://github.com/Suno-API/Suno-API)** — Go implementation

---

## Setup

### 1. Deploy Suno API Instance

Choose one of the implementations above and deploy it separately (Docker, Heroku, AWS, etc.).

**Example: Local Docker**
```bash
git clone https://github.com/gcui-art/suno-api.git
cd suno-api
docker build -t suno-api .
docker run -p 8000:8000 suno-api
```

**Result:** Suno API running at `http://localhost:8000`

### 2. Record the Base URL

Your Suno API instance should expose:
- Health endpoint: `GET /api/health` or `/health`
- Generation endpoint: `POST /api/generate`

Example URLs:
- Local: `http://localhost:8000`
- Self-hosted: `https://suno.yourcompany.com`
- Cloud: `https://suno-instance-name.herokuapp.com`

### 3. Test Connectivity

```bash
curl -X GET http://localhost:8000/api/health
# Expected response: {"status": "ok"}
```

### 4. Configure The Decks

Add to Vercel **Settings > Environment Variables**:

```
SUNO_API_BASE_URL=http://localhost:8000
```

Or in `.env.local` for local development:

```bash
cp .env.example .env.local
# Edit .env.local
SUNO_API_BASE_URL=http://localhost:8000
```

### 5. Test Integration

```bash
npm run dev
# Open http://localhost:3000
# Click "Load demo tracks"
# Load a track to Deck A
# Click remix icon
# Configure settings
# Click "Generate style interpretation"
# Should return candidates or helpful error message
```

---

## API Endpoint Behavior

### Request

The Decks sends **POST** to `/api/suno/remix` with:

```json
{
  "track": {
    "title": "Track Name",
    "artist": "Artist Name",
    "bpm": 120,
    "key": "1A"
  },
  "genre": "UK Garage",
  "direction": "Underground club",
  "intensity": 75,
  "arrangement": ["Keep vocals"],
  "rightsConfirmed": true
}
```

### Processing

The backend:
1. Validates all inputs (Zod schema)
2. Constructs a Suno prompt using track metadata and style controls
3. Sends **POST** to `${SUNO_API_BASE_URL}/api/generate` with:

```json
{
  "prompt": "Create a new UK Garage track inspired by the musical metadata of \"Track Name\" by Artist Name. Aim for 120 BPM, compatible with Camelot key 1A, with a Underground club character. Creative intensity: 75 percent. Arrangement direction: Keep vocals. Compose an original interpretation rather than copying the source recording, melody, lyrics, or artist identity. Deliver a polished, DJ-friendly arrangement with a clear intro, evolving main section, and controlled low end.",
  "make_instrumental": false,
  "wait_audio": true
}
```

4. Waits up to 180 seconds for Suno to generate candidates
5. Returns up to 4 candidates with audio URLs

### Response

```json
{
  "candidates": [
    {
      "id": "clip-id-123",
      "title": "Track Name (UK Garage interpretation)",
      "status": "complete",
      "duration": 240,
      "artworkUrl": "https://...",
      "audioUrl": "https://..."
    }
  ]
}
```

---

## Error Handling

| Error | Status | Cause | Fix |
|-------|--------|-------|-----|
| "Suno remix generation is not configured" | 503 | `SUNO_API_BASE_URL` not set | Add env var |
| "SUNO_API_BASE_URL is not a valid HTTP URL" | 503 | Invalid URL format | Check URL format |
| "Could not connect to the configured Suno service" | 502 | Suno API unreachable | Check URL, firewall, uptime |
| "The Suno service returned status 429" | 502 | Rate limited | Retry later |
| "Suno took too long to generate the track" | 504 | Timeout (>180s) | Retry; Suno may be busy |
| "The Suno service returned an unexpected response" | 502 | Suno returned invalid JSON | Check Suno API logs |
| "Suno did not return any remix candidates" | 502 | Suno returned empty array | Retry generation |

---

## Suno API Prompt Engineering

The Decks automatically constructs Suno prompts from:

1. **Track Metadata**
   - Title, artist, BPM, Camelot key
   - Used to ground the generation in the original track's context

2. **Style Controls**
   - Genre (UK Garage, Afro House, Drum & Bass, Melodic Techno)
   - Direction (Underground club, Festival peak, Late-night minimal, Radio edit)
   - Intensity (0–100%)
   - Arrangement options (Keep vocals, Extend intro, Club outro)

3. **Rights Notice**
   - Prompt includes instruction to create "original interpretation" not "audio remix"
   - Users must confirm rights before generation

**Example Prompt:**
```
Create a new UK Garage track inspired by the musical metadata of "Neon Current" by Mira Sol. 
Aim for 124 BPM, compatible with Camelot key 8A, with a Underground club character. 
Creative intensity: 68 percent. 
Arrangement direction: Keep vocals. 
Compose an original interpretation rather than copying the source recording, melody, lyrics, or artist identity. 
Deliver a polished, DJ-friendly arrangement with a clear intro, evolving main section, and controlled low end.
```

---

## Performance & Scaling

### Single Request
- Generation typically takes 30–120 seconds (Suno backend dependent)
- Frontend timeout: 30 seconds (client-side)
- Backend timeout: 180 seconds (server-side)

### Multiple Concurrent Requests
- Vercel handles auto-scaling (up to 50 concurrent functions)
- Suno API likely has rate limits (check their docs)
- Consider implementing a job queue for high-volume deployments

### Result Caching
- Remix candidates are not cached (ephemeral)
- To cache results, add Redis and persist candidates by track + style hash

---

## Monitoring

### Vercel Logs
```bash
# View remix generation requests
vercel logs --tail

# Filter for errors
vercel logs | grep "suno\|error\|502\|503\|504"
```

### Metrics to Track
- Average generation time
- Error rate (by error type)
- Rate limit hits (429 status)
- Timeout rate (504 status)

---

## Troubleshooting

### "503: Suno remix generation is not configured"

**Cause:** `SUNO_API_BASE_URL` not set

**Fix:**
1. Check Vercel **Settings > Environment Variables**
2. Verify `SUNO_API_BASE_URL` is set to your Suno instance URL
3. Redeploy: `vercel deploy --prod`

### "502: Could not connect to the configured Suno service"

**Cause:** Suno API unreachable

**Fix:**
1. Test connectivity: `curl https://your-suno-url/api/health`
2. Verify URL is correct (no typos)
3. Check firewall/security groups allow outbound HTTPS
4. Verify Suno instance is running and healthy
5. Check Suno instance logs for errors

### "504: Suno took too long to generate the track"

**Cause:** Generation exceeded 180 seconds

**Fix:**
1. Retry the request (Suno may be temporarily busy)
2. Check Suno instance logs
3. Monitor Suno server resource usage (CPU, RAM, network)
4. Consider increasing backend timeout in `frontend/app/api/suno/remix/route.ts`

### "502: The Suno service returned status 429"

**Cause:** Rate limited by Suno API

**Fix:**
1. Implement request queuing (simple job queue or Redis)
2. Add retry logic with exponential backoff
3. Check Suno API rate limit documentation
4. Contact Suno support if rate limits are too restrictive

---

## Advanced: Custom Prompt Optimization

To customize the Suno prompt generation, edit `frontend/app/api/suno/remix/route.ts`:

```typescript
const prompt = [
  // Edit these lines to adjust prompt structure
  `Create a new ${genre} track inspired by the musical metadata of "${title}" by ${artist}.`,
  `Aim for ${Math.round(bpm)} BPM, compatible with Camelot key ${key}, with a ${direction.toLowerCase()} character.`,
  // Add your custom instructions
].filter(Boolean).join(' ')
```

---

## References

- **Suno Website:** https://suno.ai
- **gcui-art/suno-api:** https://github.com/gcui-art/suno-api
- **Suno-API/Suno-API:** https://github.com/Suno-API/Suno-API
- **Camelot Wheel:** https://en.wikipedia.org/wiki/Camelot_wheel

---

**Last Updated:** 2026-07-19  
**Maintained by:** Copilot Operator
