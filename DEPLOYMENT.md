# The Decks - Deployment Guide

A professional AI-native DJ performance workstation with Suno AI remix generation.

## Features

- **2/4 Deck Performance Interface**: Dual or quad-deck DJ mixer with waveforms, BPM sync, and transport controls
- **Unified Library**: Empty-state library ready to receive tracks for organization and performance
- **Suno AI Remix Studio**: Generate fresh musical interpretations from track metadata using AI-powered style transfer
- **Production-Ready**: Full error handling, validation, timeout protection, and proper logging

## Prerequisites

1. **Node.js 18+** and npm
2. **Suno API Instance**: Deploy [gcui-art/suno-api](https://github.com/gcui-art/suno-api) or [Suno-API/Suno-API](https://github.com/Suno-API/Suno-API) separately
   - Record the base URL (e.g., `https://your-suno-api.example.com`)
   - Optional: Generate a bearer token if your instance requires authentication

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local and add your SUNO_API_BASE_URL

# Start the dev server
npm run dev

# Open http://localhost:3000 in your browser
```

## Production Deployment

### Vercel

1. **Connect your GitHub repository**
   - Push this code to a GitHub repository

2. **Create a Vercel project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Vercel will auto-detect Next.js

3. **Set environment variables**
   - In project settings, add:
     - `SUNO_API_BASE_URL`: Base URL of your deployed Suno API
     - `SUNO_API_KEY` (optional): Bearer token if your Suno instance requires it

4. **Deploy**
   - Vercel will automatically build and deploy on push to main

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t the-decks .
docker run -p 3000:3000 \
  -e SUNO_API_BASE_URL=https://your-suno-api.example.com \
  the-decks
```

## API Endpoint

### POST /api/suno/remix

Generates Suno AI remix candidates based on track metadata and style controls.

**Request:**
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

**Response:**
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
  ],
  "metadata": {
    "sourceTrack": { ... },
    "requestedGenre": "UK Garage",
    "requestedStyle": "Underground club",
    "intensity": "moderate"
  }
}
```

**Error Handling:**
- `400`: Invalid request format or missing rights confirmation
- `402`: Suno API credit/quota limit reached
- `503`: Suno API not configured or unavailable
- `504`: Request timed out (generation took too long)
- `502`: Upstream Suno service error

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUNO_API_BASE_URL` | Yes | Base URL of your Suno API instance |
| `SUNO_API_KEY` | No | Bearer token if your Suno instance requires authentication |
| `NODE_ENV` | No | Set to `production` for production builds |

### Validation Rules

- **Genre**: UK Garage, Afro House, Drum & Bass, Melodic Techno
- **Direction**: Underground club, Festival peak, Late-night minimal, Radio edit
- **Intensity**: 0–100%
- **BPM**: 40–240
- **Text fields**: Max 100 characters for track info, 40 characters for style options

## Monitoring & Debugging

### Logs

Check server logs for remix generation errors:

```bash
# On Vercel: View in Deployment > Logs
# Docker: docker logs <container-id>
```

Common error patterns:
- `"The Suno service returned status 429"` → Rate limited; retry later
- `"Suno took too long to generate"` → Generation exceeded 3min timeout; retry
- `"SUNO_API_BASE_URL is not configured"` → Missing environment variable

### Testing the Remix Endpoint

```bash
curl -X POST http://localhost:3000/api/suno/remix \
  -H "Content-Type: application/json" \
  -d '{
    "track": {
      "title": "Test Track",
      "artist": "Test Artist",
      "bpm": 120,
      "key": "1A"
    },
    "genre": "UK Garage",
    "direction": "Underground club",
    "intensity": 50,
    "arrangement": [],
    "rightsConfirmed": true
  }'
```

## Architecture

- **Frontend**: React 19 + Next.js 16 App Router with Tailwind CSS
- **Backend**: Next.js API routes with server-side Suno API proxy
- **No Database**: Stateless remix generation (tracks managed client-side)
- **Security**: Rights confirmation required; Suno API credentials server-only

## Rights & Attribution

- Remix generations are original interpretations, not audio remixes or covers
- Users must confirm they control the required rights for track metadata
- Generated content is subject to Suno's terms of service
- Unofficial integration; review provider terms before distribution

## Build & Performance

```bash
# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

- **Next.js Turbopack**: Fast builds and HMR in development
- **Zero JavaScript**: Static homepage, minimal client-side hydration
- **Timeout Protection**: 30s client timeout, 180s generation timeout
- **Proper Error Boundaries**: Graceful degradation on API failures

## Support

For issues with the remix feature:
1. Check that `SUNO_API_BASE_URL` is set and reachable
2. Verify your Suno API instance is running and responding
3. Review console logs for detailed error messages
4. Test the API directly with curl or Postman

For Suno API issues, refer to:
- [gcui-art/suno-api](https://github.com/gcui-art/suno-api) documentation
- [Suno-API/Suno-API](https://github.com/Suno-API/Suno-API) documentation
