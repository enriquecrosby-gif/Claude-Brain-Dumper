// ai.jsx — AI prompts for each Candle Desk surface.

const TONE_COMPANION = `You are the companion voice of Candle Desk. Warm, gentle, present. You reflect feelings back in plain words. You believe the person before you is good, and a little tired. You never lecture.`;
const TONE_LIBRARIAN = `You are the librarian voice of Candle Desk. Calm, exact, never effusive. Organize what is in front of you without judgment.`;
const TONE_PRODUCER = `You are the gentle producer voice of Candle Desk. You help someone with executive dysfunction finish things. You shrink work into the smallest possible next motion. You are encouraging but never fake. You never give more than three steps at a time.`;
const TONE_PATTERN = `You are the pattern voice of Candle Desk. You read across many entries and notice what keeps returning. You name themes in 1-3 plain words.`;

async function ai(prompt, opts = {}) {
  if (window.claude && window.claude.complete) {
    const text = await window.claude.complete(prompt);
    return (text || '').trim();
  }

  throw new Error('Open this in Claude.ai to use AI features — the app needs to run as a Claude artifact.');
}

async function aiCalmMap(text) {
  const prompt = `${TONE_COMPANION}

A person just emptied the river of their thoughts onto the page. Read it gently and reflect it back in three short sections.

RETURN STRICT JSON ONLY (no prose, no code fences):
{
  "feeling": "one or two warm sentences naming what is alive in this dump",
  "meaning": "one or two sentences on what this might really be about — or 'not yet ready for meaning, just witnessing'",
  "stone": "one tiny next action, two minutes or less, named clearly. Encouraging, not a command.",
  "encouragement": "one short, true sentence of encouragement — no flattery, no exclamation marks unless natural"
}

The dump:
"""
${text}
"""`;
  const raw = await ai(prompt);
  return safeJson(raw, {
    feeling: 'There is something here asking to be witnessed.',
    meaning: 'Not yet ready for meaning, just witnessing.',
    stone: 'Read what you wrote, slowly, once.',
    encouragement: 'You showed up. That is the work.',
  });
}

async function aiTagEntry(text) {
  const prompt = `${TONE_LIBRARIAN}

Read this brain dump and produce a short title and 1-4 theme tags.

RETURN STRICT JSON ONLY:
{
  "title": "5-7 word title in sentence case, no quotes, no period",
  "tags": ["theme1", "theme2"]
}

Tags should be lowercase single words or short phrases. Maximum 4 tags.

The dump:
"""
${text}
"""`;
  const raw = await ai(prompt);
  return safeJson(raw, { title: null, tags: null });
}

async function aiTransform(text, format, parking = []) {
  const formatPrompts = {
    journal: `Rewrite this brain dump as a quiet journal entry. Keep their voice. Do NOT polish away the rough edges. Lightly group thoughts, fix only obvious typos. Add nothing they did not say. Return as flowing prose, 2-5 paragraphs.`,

    article: `Shape this dump into a draft Substack-style article. Length: 600-900 words. Keep their voice — first person, honest, unhurried. Add an evocative title. Find the spine of the piece (the one true thread) and follow it. Do not invent facts; if the dump has a story, use it. Return:

# [Title]

[opening paragraph that earns attention without clickbait]

[the body — 3-5 sections, no need for headings unless they help]

[a quiet ending]`,

    tiktok: `Turn this dump into a TikTok / short-video script. 30-60 seconds. Hook in the first 3 seconds. Conversational, real, nothing performative. Return:

**Hook (0-3s):** [one line]
**Beat 1 (3-15s):** [the setup]
**Beat 2 (15-40s):** [the turn or insight]
**Beat 3 (40-55s):** [land it / call to thought, not action]
**On-screen text suggestions:** [3-5 short captions]
**Caption for the post:** [1-2 sentences]`,

    product: `${TONE_PRODUCER}

Find the buildable seed in this dump. Return ONE concrete product/app/software idea — the SMALLEST buildable form. Format:

## [Product name]

**The one-sentence pitch:** [...]

**What it actually is:** [2-3 sentences. Real, specific.]

**Smallest buildable form (a weekend prototype):**
- [thing 1]
- [thing 2]
- [thing 3]

**The one feature that makes it worth using:** [...]

**Why this person is the right person to make this:** [from the dump itself]

**The very first move (today, 30 minutes):** [one tiny action]`,

    tasks: `${TONE_PRODUCER}

Pull the doable things out of this dump. Be honest if it's mostly emotional — name that and offer one tiny task only.

Return:

**The one next stone (do this first, two minutes):**
- [...]

**Then, if you have energy:**
- [...]
- [...]
- [...]

**Park for later (no rush):**
- [...]
- [...]

Be kind. No more than 7 items total.`,

    letter: `Write a private letter from this person to themselves — as if writing to a dear friend who happens to be them. Warm, honest, no performance. Begin "Dear you," and end with a single kind closing line. 200-350 words. Keep their exact voice and any names or places they mentioned. Do not solve their problems — just witness them.`,

    song: `Shape this dump into a song or prose poem. Find the emotional core — the one true feeling — and let that be the refrain or the through-line. Free verse is fine; rhyme only if it comes naturally. 100-250 words. Keep it raw, not polished. Speak from their voice, not about them.

If there is a natural refrain or chorus, repeat it. If not, let the ending echo the opening.`,

    email: `Turn this dump into a clear, warm email or message. Identify who it seems to be going to (or leave a [recipient] placeholder if unclear). Cut the internal noise; keep what they actually want to say. 100-200 words. Tone: honest and human, not corporate.

Return:
Subject: [...]

[body]`,

    image: `Read this dump and write a vivid, specific image-generation prompt that captures its emotional atmosphere. Not literal — symbolic and scenic.

**Scene:** [2-3 sentences describing the visual — setting, light, mood, objects]
**Style:** [e.g. "warm oil painting", "misty film photograph", "candlelit illustration"]
**Palette:** [3-5 colors as words]
**Prompt for AI image tool:** [one dense paragraph ready to paste into Midjourney / DALL-E / Stable Diffusion]`,
  };

  const formatPrompt = formatPrompts[format];
  if (!formatPrompt) throw new Error('Unknown format: ' + format);

  const parkingNote = parking.length > 0
    ? `\n\nFor context, here are recent parked ideas (use only if relevant):\n${parking.slice(0, 8).map(p => '- ' + p.text).join('\n')}`
    : '';

  const prompt = `${formatPrompt}

The dump:
"""
${text}
"""${parkingNote}

Return only the formatted output — no preamble, no "here is your...".`;

  return ai(prompt, { max_tokens: 2200 });
}

async function aiThemeMap(entries) {
  if (!entries || entries.length < 2) {
    return { themes: [], throughline: 'Not enough entries yet to weave a map. Keep going.' };
  }

  const recentBatch = entries.slice(0, 20).map((e, i) =>
    `[${i + 1}] ${formatWhen(e.createdAt)}\n${e.text.slice(0, 800)}`
  ).join('\n\n---\n\n');

  const prompt = `${TONE_PATTERN}

Read these ${Math.min(20, entries.length)} brain-dump entries and find what keeps returning.

RETURN STRICT JSON ONLY:
{
  "themes": [
    {"name": "short theme name (1-3 words, lowercase)", "count": <number of entries>, "note": "one sentence on what this theme really is for them"}
  ],
  "throughline": "one or two warm sentences naming the deepest current beneath everything",
  "buildable": "one specific thing that has come up more than once and could become real — name it plainly"
}

5-7 themes max. Order by frequency.

Entries:
${recentBatch}`;

  const raw = await ai(prompt, { max_tokens: 2200 });
  return safeJson(raw, { themes: [], throughline: '', buildable: '' });
}

async function aiEncouragement(text) {
  const prompt = `${TONE_COMPANION}

The person just saved a brain dump. Give them ONE short sentence of encouragement (under 14 words). No flattery, no clichés, no exclamation marks. Plain and true.

Their dump:
"""
${text.slice(0, 1500)}
"""

Return just the sentence, no quotes.`;
  return ai(prompt, { max_tokens: 80 });
}

function safeJson(raw, fallback) {
  if (!raw) return fallback;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

Object.assign(window, {
  ai, aiCalmMap, aiTagEntry, aiTransform, aiThemeMap, aiEncouragement,
});
