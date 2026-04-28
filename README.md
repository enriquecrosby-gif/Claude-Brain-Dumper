# Claude Brain Dumper

A minimal, fast brain-dump tool built with Vite + React. Pour your raw thoughts into the textarea — it autosaves to localStorage as you type, lets you export a timestamped `.md` file, and wraps your dump in an AI-harvest prompt so you can paste it directly into Claude.

## Features

- **Autosave** — debounced localStorage save every 800ms (green dot indicator)
- **Save Draft** — manual save with toast confirmation
- **Export .md** — downloads content as a timestamped Markdown file
- **Copy for AI Harvest** — prepends a Claude-ready prompt, copies to clipboard
- **Word count** live in the header
- Warm dark minimal styling, no external UI libraries

## Local dev

```bash
npm install
npm run dev
```

## Deploy (Railway)

Build: `npm run build`  
Start: `npm run preview -- --port $PORT --host`

Configured via `railway.json` — Railway / Nixpacks will detect it automatically.
