# The Decks — Vercel Deployment Guide

## Quick Start (5 minutes)

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd thedecks
vercel deploy --prod
```

Or use the web UI:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select GitHub repository `cdxidigital/thedecks`
3. Vercel auto-detects Next.js
4. Click **Deploy**

### 2. Set Environment Variables

In Vercel project **Settings > Environment Variables**, add:

```
SUNO_API_BASE_URL=https://your-suno.example.com
```

Optionally:
```
SUNO_API_KEY=your-bearer-token
```

### 3. Redeploy

```bash
vercel deploy --prod
```

**Your app is now live!** Visit the deployment URL (e.g., `thedecks.vercel.app`).

---

## Build Configuration

Vercel automatically reads `vercel.json`:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "installCommand": "cd frontend && npm install"
}
```

**No additional configuration needed.**

---

## Testing on Vercel

### Demo Mode (No Suno API Required)
```
1. Visit https://your-deployment.vercel.app
2. Click "Load demo tracks"
3. Load a track to Deck A
4. Click remix icon
5. Modal opens and settings are configurable ✅
```

### With Suno API
```
1. Deploy Suno API separately (see DEPLOYMENT.md)
2. Add SUNO_API_BASE_URL to Vercel environment
3. Redeploy
4. Try remix workflow → should generate candidates ✅
```

---

## Monitoring

### Logs
- **Vercel Dashboard > Logs (Functions)**
- Filter by `/api/suno/remix` to see remix requests
- Look for errors: 502, 503, 504, timeout

### Metrics
- **Deployments**: Build status, durations
- **Analytics**: Request counts, response times
- **Edge Network**: Cache hit rates

---

## Common Issues

### Build Fails: "Cannot find module"
- Check `frontend/package.json` — dependencies may be missing
- Clear Vercel cache: **Settings > Git > Clear Build Cache**
- Redeploy

### 503 Error on Remix Endpoint
- `SUNO_API_BASE_URL` not set or incorrect
- Fix in Vercel **Settings > Environment Variables**
- Redeploy

### 502 Error
- Suno API unreachable (check URL, firewall, uptime)
- Verify `SUNO_API_BASE_URL` is correct and responding
- Test: `curl https://your-suno.example.com/api/health`

### 504 Error (Timeout)
- Suno generation exceeded 180 seconds
- Retry — Suno may be rate-limited or busy
- Check Suno instance logs

---

## Advanced Configuration

### Custom Domain
1. **Vercel Dashboard > Settings > Domains**
2. Add custom domain (e.g., `decks.yourcompany.com`)
3. Point DNS to Vercel

### Analytics
```javascript
// Frontend already includes @vercel/analytics
// Automatically tracks Web Vitals in Vercel Dashboard
```

### Preview Deployments
```bash
# Each PR auto-deploys to a preview URL
# E.g., https://thedecks-git-feature-branch-cdxidigital.vercel.app
```

---

## Scaling & Performance

### Edge Caching
- Next.js automatically caches static pages
- Remix endpoint results are not cached (dynamic)
- Consider Redis for remix result caching if high volume

### Rate Limiting
- Suno API likely has rate limits (check their docs)
- Frontend includes 180s timeout per request
- Consider implementing request queuing for multiple concurrent users

---

## Security Checklist

- [ ] `SUNO_API_KEY` is a Vercel secret (never in repo)
- [ ] Remix endpoint validates all inputs (Zod schema)
- [ ] Rights confirmation required before generation
- [ ] No audio uploaded (metadata-only generation)
- [ ] Vercel Edge Middleware not needed (stateless API)

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Suno API Docs:** Check your instance's README
- **This Project:** See DEPLOYMENT.md for full setup
