<p align="center">
  <img src="./branding/pixelflow-logo.svg" alt="PixelFlow logo" width="72" height="72" />
</p>

<h1 align="center">PixelFlow</h1>
<p align="center"><strong>LINK INTELLIGENT PLAYER</strong></p>
<p align="center">Plays any streamable link, with TeraBox (best-effort, may fail) and Pixeldrain support, plus resilient stream analysis, adaptive strategy selection, and inline analytics.</p>

<p align="center">
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" /></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19-20232A?logo=react" /></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" /></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://github.com/video-dev/hls.js/"><img alt="hls.js" src="https://img.shields.io/badge/hls.js-Enabled-1f2937" /></a>
  <a href="https://github.com/Dash-Industry-Forum/dash.js"><img alt="dash.js" src="https://img.shields.io/badge/dash.js-Enabled-1f2937" /></a>
  <img alt="License" src="https://img.shields.io/badge/License-MIT-22c55e" />
</p>

<p align="center">
  <strong>Live Demo:</strong><a href="https://pixelflow-player.vercel.app"> pixelflow-player.vercel.app</a>
</p>

## Overview
PixelFlow is a Next.js App Router project for robust playback of shared media links. It analyzes source URLs, resolves provider links into playable resources, picks a safe playback strategy, and streams through a controlled proxy when needed.

The player experience includes:
- Session intake for media links
- Format-aware playback strategy selection (native, HLS, DASH, proxy)
- Stream health diagnostics and retries
- Inline analytics panel without navigation (playback keeps running)
- Keyboard and seek controls for practical playback management

## Core Capabilities
- Broad streamable-link support with dedicated resolvers for TeraBox (best-effort) and Pixeldrain
- `/api/analyze` decision endpoint with rate limiting and safe URL checks
- `/api/stream` proxy endpoint with header filtering and manifest rewrite support
- Adaptive client playback via native element, `hls.js`, and `dash.js`
- Analytics snapshots and live diagnostics updates
- Branded UI with reusable logo and centralized branding config

## Tech Stack
- Framework: Next.js 16 (App Router, Route Handlers)
- UI: React 19, Tailwind CSS, Lucide icons, Framer Motion
- Language: TypeScript 5
- Streaming: native HTML5 video, `hls.js`, `dash.js`
- Runtime: Node.js (Next route handlers use Node runtime)
- Tooling: ESLint, TypeScript, Node test runner (`node --test`)

## Project Structure
```text
app/
  api/
    analyze/route.ts      # Source analysis + strategy decision endpoint
    stream/route.ts       # Proxy streaming endpoint
  analytics/page.tsx      # Standalone analytics route
  layout.tsx              # Root layout, fonts, metadata
  page.tsx                # Home + player shell

components/
  SmartPlayer.tsx         # Main orchestrator UI
  AnalyticsDashboard.tsx  # Reusable analytics panel (standalone + embedded)
  playerController.ts     # Playback strategy lifecycle
  adapters/               # native/hls/dash adapters
  hooks/usePlayerSession.ts

branding/
  PixelFlowLogo.tsx       # Reusable brand lockup
  pixelflow-logo.svg      # README/logo asset

lib/
  sourceResolver.ts       # Provider URL resolution
  analyzer.ts             # Stream metadata analysis
  decisionEngine.ts       # Strategy selection
  security.ts             # Rate limit + request safety
  urlValidation.ts        # URL and network boundary checks
```

## Getting Started
### Prerequisites
- Node.js 20+
- npm 10+

### Install
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Application starts on `http://localhost:3001`.

### Production Build
```bash
npm run build
npm run start
```

## Available Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Start development server on port 3001 |
| `npm run build` | Create production build |
| `npm run start` | Start production server on port 3001 |
| `npm run test` | Run Node test suite in `lib/**/*.test.ts` |
| `npm run typecheck` | Run TypeScript checks |
| `npm run lint` | Run ESLint |

## Usage Flow
1. Open the app.
2. Paste one or more media links into Session Intake.
3. Apply session.
4. PixelFlow analyzes source and loads playback using the best strategy.
5. Use Open Analytics to expand inline diagnostics below the player.

Notes:
- Opening analytics does not navigate away from the player.
- Reload starts with a clean session input (source links are not persisted).

## API Reference
### `POST /api/analyze`
Analyzes the provided URL, resolves provider links, and returns a playback strategy.

Request body:
```json
{
  "url": "https://example.com/media-or-share-link",
  "forceProxy": false
}
```

Typical success response:
```json
{
  "success": true,
  "playableUrl": "/api/stream?url=https%3A%2F%2F...",
  "strategy": "proxy",
  "metadata": {
    "contentType": "video/mp4"
  },
  "sourceResolution": {
    "provider": "pixeldrain",
    "status": "resolved"
  }
}
```

### `GET /api/stream?url=<encoded-url>`
Fetches and relays stream bytes through a guarded proxy.

Behavior highlights:
- Request rate limiting per client
- Allow-listed forwarded headers
- Allow-listed response headers
- Manifest rewrite for HLS/DASH playlists where applicable

## Security and Reliability
- Private-network and invalid URL blocking in validation layer
- Request rate limiting on analyze and stream endpoints
- Retry logic and strategy fallback in player controller
- Controlled proxy behavior to reduce unsafe direct fetches

## Branding
Brand configuration is centralized in `lib/branding/branding.ts`.

Reusable brand assets:
- `branding/PixelFlowLogo.tsx` for UI usage
- `branding/pixelflow-logo.svg` for documentation and external previews

## License
This project is licensed under MIT. See `LICENSE` for details.

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, quality checks, and pull request requirements.

## Security
Please read [SECURITY.md](SECURITY.md) for responsible disclosure and vulnerability reporting guidance.
