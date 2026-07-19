# The Decks — DJ Remix Workspace with Suno AI

A production-ready Next.js DJ mixing interface that integrates Suno AI for generating style-based track remixes. Load tracks, mix them on digital decks, and generate AI interpretations using metadata-driven generation.

## Features

- **2-deck & 4-deck layouts** – Toggle between compact and full mixing setups
- **Suno AI remix generation** – Generate new interpretations of tracks based on metadata and style controls
- **Digital mixer** – Channel faders, EQ knobs (HIGH/MID/LOW), crossfader, CUE monitoring
- **Hot cue & loop controls** – Standard DJ transport controls with disabled state when no track is loaded
- **Real-time library search** – Filter and select tracks for loading to decks
- **Demo tracks included** – Click "Load demo tracks" to test the full workflow without importing

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Load Demo Tracks

Click **"Load demo tracks"** in the empty library to populate with 4 sample tracks. This enables:
- Loading tracks to decks (click deck letter buttons)
- Testing the remix workflow without external integrations
- Verifying UI and playback states

## Production Deployment

### 1. Connect Suno API

Set the `SUNO_API_BASE_URL` environment variable to point to your Suno API instance:

```
SUNO_API_BASE_URL=https://your-suno-api.example.com
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup, configuration, monitoring, and troubleshooting.

### 2. Build & Deploy

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
vercel deploy
```

## Remix Workflow

1. **Select a track** from the library
2. **Click "Remix"** to open the Suno Style Studio
3. **Choose remix settings:**
   - Target genre (UK Garage, Afro House, Drum & Bass, Melodic Techno)
   - Style direction (Underground club, Festival peak, Late-night minimal, Radio edit)
   - Creative intensity (0–100%)
   - Arrangement options (Keep vocals, Extend intro, Club outro)
4. **Confirm rights** and click "Generate style interpretation"
5. **Preview candidates** and export audio

## Architecture

- **Frontend:** Next.js 16 + React 19 with server-side rendering
- **Styling:** Tailwind CSS v4 with semantic design tokens
- **API:** Server-side proxy to Suno API with validation, error handling, and timeout protection
- **Performance:** Zero demo data in production; clean hydration; optimized async generation

## Environment Variables

See `.env.example` for template. Required for production:

- `SUNO_API_BASE_URL` – Base URL of deployed Suno API instance

## Licensing & Attribution

- Uses the [gcui-art/suno-api](https://github.com/gcui-art/suno-api) wrapper and [Suno-API/Suno-API](https://github.com/Suno-API/Suno-API) Go implementation
- Suno AI integration requires compliance with Suno's terms
- Generated tracks are original interpretations; confirm rights before distribution

## Built with v0

[Continue working on v0 →](https://v0.app/chat/projects/prj_jxHrerGAAupxbOauu8sLffcAY51k)
