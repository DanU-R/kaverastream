# RushBoard — Live Sports Scheduler

A live sports event scheduler/dashboard that consumes the public stream API
(`api.ppv.st/api`). Built with Next.js 16 (App Router) + Tailwind. Fully static-deliverable; all data fetched client-side (API sends `Access-Control-Allow-Origin: *`).

## Features
- **Live Now** section with auto-refresh + viewer count (11 categories, ~176+ events)
- **Upcoming** events per category with local timestamps
- **Event detail** page with embedded player frame
- **On-Demand (VODs)** catalog with video playback (HLS via native `<video>`)
- Live badge / 24/7 stream support / source tags (league, broadcaster)

## Stack
- Next.js 16.3.4 (App Router, Turbopack, TypeScript)
- Tailwind CSS v4
- Zero backend — talks directly to the public API (CORS `*`)

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## Production build
```bash
npm run build
npm run start
```

## Deploy to Vercel
1. `git init` + push this repo to GitHub/GitLab.
2. Import the repo in Vercel (framework: **Next.js**, auto-detected).
3. Optional env var (defaults already point to the public API):
   - `NEXT_PUBLIC_API_BASE=https://api.ppv.st/api`
4. Deploy. All routes are dynamic/`force-dynamic` so live data always refreshes.

> Deploy via the Vercel CLI too:
> ```bash
> npx vercel --prod
> ```

## Project structure
```
app/
  page.tsx            # home (Live Now + categories)
  event/[id]/page.tsx # event detail + player
  vods/page.tsx       # on-demand catalog
  vod/[id]/page.tsx   # vod detail + playback
components/           # client components (HomeClient, EventClient, ...)
lib/api.ts            # typed API client + helpers
```

## API surface consumed (public, no auth)
| Endpoint | Use |
|---|---|
| `GET /api/streams` | Full live catalog (categorised) |
| `GET /api/streams/{id}` | Single event detail (incl. player source) |
| `GET /api/vods` | On-demand catalog |
| `GET /api/vods/{id}` | Single VOD detail (incl. m3u8 source) |
