# Claude Brain-Dumper — *Candle Desk*

A quiet place for thoughts. Pour your raw mind onto the page, and let it become something finished.

Candle Desk is the living form of Brain-Dumper: a calm, three-room app that catches a brain-dump and — with an AI harvest running *inside the app* — turns it into a Suno song prompt, a Substack article, a TikTok script, a product idea, a poem, an image prompt, and more.

## The three rooms

- **Desk** — where you pour the dump. A warm writing surface; entries autosave into the River.
- **River** — the stream of everything you've poured before, given titles and theme tags.
- **Workshop** — where a dump becomes something. Pick a format and the app generates it:
  - **Suno** song prompt · **Substack** article · **TikTok** script · **product / app idea** · journal entry · letter to yourself · poem / song · **image** prompt · email

Before it works, it *witnesses*: a calm reflection of what's alive in the dump, and one tiny next "stone." A theme map reads across many entries to name what keeps returning.

Downloads are Obsidian-ready `.md` so your words stay yours.

## Setup

This app calls the Anthropic API from a small backend, so it needs a key.

1. Set an environment variable `ANTHROPIC_API_KEY` (your Anthropic key).
2. Without it, the app still runs — but the Workshop will show a friendly "AI unavailable" message instead of generating.

## Local dev

```bash
npm install
npm run dev          # Vite dev server for the frontend (candle-desk/)
```

To run the full app with the AI backend locally:

```bash
ANTHROPIC_API_KEY=sk-... npm start    # node server.js
```

## Deploy (Railway)

Start command: `node server.js` (already set in `railway.json`).

Add `ANTHROPIC_API_KEY` under Railway → **Variables**. Railway / Nixpacks detects the config automatically.

## How it's built (plain version)

- **Frontend** lives in `candle-desk/` — `index.html` + `public/*.jsx`, rendered in the browser (React + Babel from a CDN). No build step required to run.
- **Backend** is `server.js` (Express): it serves the frontend and exposes `POST /api/complete`, which calls Anthropic (`claude-sonnet-4-6`) with a generous response length so answers don't get cut off mid-sentence.

---

*Brain-Dumper is a room in **Anima-Garden** — see `CLAUDE.md` for the soul behind it. The heartbeat: "I'm here. I see you." No thought goes unseen or unfinished.*
