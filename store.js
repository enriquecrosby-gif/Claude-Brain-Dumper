/* Candle Desk — store: localStorage data layer + AI helpers */

const KEY_ENTRIES = 'candleDesk.entries.v1';
const KEY_PARKING = 'candleDesk.parking.v1';
const KEY_DRAFT   = 'candleDesk.draft.v1';
const KEY_TWEAKS  = 'candleDesk.tweaks.v1';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(KEY_ENTRIES) || '[]'); }
  catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem(KEY_ENTRIES, JSON.stringify(entries));
}

function loadParking() {
  try { return JSON.parse(localStorage.getItem(KEY_PARKING) || '[]'); }
  catch { return []; }
}

function saveParking(items) {
  localStorage.setItem(KEY_PARKING, JSON.stringify(items));
}

function loadDraft() {
  return localStorage.getItem(KEY_DRAFT) || '';
}

function saveDraft(text) {
  localStorage.setItem(KEY_DRAFT, text);
}

/* Seed sample entries on first run so the River and Workshop have life */
function seedIfEmpty() {
  if (loadEntries().length > 0) return;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const seed = [
    {
      id: uid(),
      createdAt: now - 6 * day,
      text: "I keep thinking about a small app that lets you press a button when you feel stuck and it gives you the smallest version of what you're avoiding. Two minute version. Like a permission slip. I think it could help people with executive dysfunction the way movement helps me on bad days. Also: I want to write more on Substack. The fear is that nothing I make ever gets finished. I have notebooks full of beginnings.",
      tags: ["product idea", "executive function", "substack"],
      reflection: {
        feeling: "An ache to make something land. The unfinished pile is heavy.",
        meaning: "Two patterns: a real product idea, and a longing to be witnessed in writing.",
        stone: "Open Substack and paste the first paragraph. Don't publish."
      }
    },
    {
      id: uid(),
      createdAt: now - 4 * day,
      text: "Walked at sunrise. The air was cold and it smelled like wet pine. I thought about the candle desk idea again. What if it really is a desk you sit at, and the AI is the candle — small, warm, doesn't demand anything. I want to make a tiktok where I just talk into the camera about how the world wants you to be a productivity machine but you are actually a small animal who needs warmth.",
      tags: ["mood", "tiktok idea", "candle desk"],
      reflection: {
        feeling: "Tender. A little protective of yourself.",
        meaning: "The 'small animal who needs warmth' line is the hook of an essay AND a video.",
        stone: "Voice-record the line into your phone before it leaves."
      }
    },
    {
      id: uid(),
      createdAt: now - 2 * day,
      text: "Three project ideas crowding me: the candle desk app, the Enrique Sparks book, and a music prompt generator. I always do this. I start three. Finish zero. What would happen if I picked one for two weeks. Just two. The candle desk feels closest to ready. Music prompts can wait. Enrique Sparks is a slow burn anyway. Also need to finish chart for Tuesday and call mom.",
      tags: ["product idea", "executive function", "tasks", "patterns"],
      reflection: {
        feeling: "Overwhelmed by your own abundance — a real and recurring pattern.",
        meaning: "You already named the answer: pick one for two weeks. Trust your own counsel.",
        stone: "Write 'Candle Desk for two weeks' on a sticky and put it on your laptop."
      }
    }
  ];
  saveEntries(seed);

  saveParking([
    { id: uid(), kind: "Product", title: "Two-Minute Permission App", body: "A button you press when stuck. AI gives you the smallest version of the task. From entry on " + new Date(now - 6*day).toLocaleDateString() + ".", sourceId: seed[0].id },
    { id: uid(), kind: "TikTok", title: "Small animal who needs warmth", body: "Talking-head: the world wants a productivity machine. You are an animal who needs warmth.", sourceId: seed[1].id },
    { id: uid(), kind: "Substack", title: "On finishing one thing", body: "Essay: the abundance of starts and the discipline of two weeks.", sourceId: seed[2].id }
  ]);
}

/* ---- AI helpers ---- */

const ENCOURAGEMENTS = [
  "You showed up. That is the work.",
  "Nothing here has to be perfect today.",
  "The candle is lit. That is enough to begin.",
  "What you wrote is already useful, even if you can't see it yet.",
  "Slowness is allowed.",
  "You are not behind. You are in your own time.",
  "The ideas are still here. They waited.",
  "One small move forward counts."
];

function pickEncouragement(seed) {
  const i = Math.abs(hashStr(seed || String(Date.now()))) % ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[i];
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* JSON-mode AI call with graceful fallback */
async function aiJSON(prompt, fallback) {
  try {
    if (!window.claude || !window.claude.complete) return fallback;
    const fenced = prompt + "\n\nReturn ONLY a single JSON object. No prose, no markdown fence.";
    const text = await window.claude.complete(fenced);
    const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return fallback;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    console.warn('aiJSON fallback', e);
    return fallback;
  }
}

async function aiText(prompt, fallback) {
  try {
    if (!window.claude || !window.claude.complete) return fallback;
    const text = await window.claude.complete(prompt);
    return text.trim();
  } catch (e) {
    console.warn('aiText fallback', e);
    return fallback;
  }
}

/* Reflection: feeling / meaning / next stone, plus tags */
async function reflectOnDump(text, tone = 'gentle') {
  const toneNote = tone === 'direct'
    ? "Speak plainly and warmly. Avoid flowery language."
    : tone === 'poetic'
    ? "Use spare, lyrical sentences. Each one short."
    : "Be gentle, warm, encouraging. Do not lecture.";

  const fallback = {
    feeling: "There is something asking to be witnessed before it is solved.",
    meaning: "This may be a threshold thought: not ready for a plan yet, but ready to be named.",
    stone: "Read it back to yourself once. Out loud, slowly.",
    tags: ["unfiled"]
  };

  return aiJSON(
    `You are a calm, warm companion to someone who struggles with executive dysfunction. They generate many ideas and need help finishing. They asked for positive encouragement. ${toneNote}

Read this brain dump and return a JSON object with these keys:
- feeling: one sentence naming the emotional current under the words
- meaning: one sentence naming the deeper pattern or what wants to be witnessed
- stone: one tiny next action — concrete, two-minute scale, never heroic. Phrase it as an invitation, not a command.
- tags: 2-5 short lowercase tags from this list when relevant: product idea, tiktok idea, substack, article, app, book, music, executive function, tasks, mood, patterns, gratitude, fear, dream, ache, body. Add new ones if needed.

The brain dump:
"""
${text}
"""`,
    fallback
  );
}

/* Cross-entry theme map */
async function findThemes(entries) {
  const fallback = {
    themes: [
      { name: "finishing", count: 2, why: "the recurring ache to land something" },
      { name: "executive function", count: 2, why: "naming the difficulty by name" },
      { name: "creative abundance", count: 2, why: "more ideas than capacity, again" }
    ],
    prose: "You return to finishing, again and again. Not as failure — as a true longing. The ideas are real. The body is tired. Both can be held."
  };

  if (!entries || entries.length === 0) return { themes: [], prose: "Once a few entries are written, themes will surface here." };

  const sample = entries.slice(0, 12).map((e, i) =>
    `--- Entry ${i+1} (${new Date(e.createdAt).toLocaleDateString()}) ---\n${e.text.slice(0, 800)}`
  ).join('\n\n');

  return aiJSON(
    `You are a quiet librarian for someone with executive dysfunction. Read these brain-dump entries and find honest patterns. Be warm and never shaming.

Return JSON:
- themes: array of 3-6 objects, each { name: short lowercase phrase, count: number of entries it touches, why: one short sentence on what the theme is }
- prose: 2-3 sentences in a calm, italicized-feeling voice that names what you see returning. No advice. No solving.

Entries:
${sample}`,
    fallback
  );
}

/* Turn a dump (or a few dumps) into a real output */
async function craftOutput(format, sourceText) {
  const formatPrompts = {
    journal: `Polish this brain-dump into a private journal entry the writer would be glad to keep. Keep their voice. Tighten only what stops the reader. Lead with a single italicized opening line that catches the feeling. Use plain paragraphs. 200-350 words.

Return JSON: { title: short evocative title, body: the polished entry as plain text with \\n\\n between paragraphs, stone: one tiny next action }`,
    article: `Turn this brain-dump into a Substack-style essay draft. Real voice, not corporate. Personal but not over-shared. Open with a single concrete image. Make a small argument. Land softly. 350-500 words.

Return JSON: { title: catchy honest title, dek: one-sentence subtitle, body: the essay as plain text with \\n\\n between paragraphs, stone: one tiny next action toward publishing }`,
    tiktok: `Turn this brain-dump into a TikTok script — talking-head, 45-60 seconds. First 3 seconds must hook. Plain spoken language. Short lines. Include a clear take or a clear question.

Return JSON: { title: working title, hook: the first 3-second hook, body: the full script as plain text with \\n between lines, caption: a 1-2 line caption with 2-4 hashtags, stone: one tiny next action }`,
    product: `Turn this brain-dump into a product/app concept with the SMALLEST buildable form. Honor that the writer struggles with finishing — the smallest form should be buildable in 1-2 sittings, not weeks.

Return JSON: { title: product name, oneliner: one sentence pitch, problem: one sentence on the pain, smallest_form: 2-3 sentences describing the absolute MVP that proves the idea, body: 2-3 short paragraphs on shape and feel, stone: the literal first 2-minute action to start it today }`,
    task: `Turn this brain-dump into a calm task list. Group by what is emotional vs what is logistical. Then mark exactly ONE next stone — the smallest, most do-able, least-scary task on the list.

Return JSON: { title: short label, emotional: array of strings (things to feel/notice, not do), logistical: array of strings (real tasks), stone: the single next stone — one short sentence, two-minute scale }`
  };

  const prompt = formatPrompts[format] || formatPrompts.journal;

  const fallback = {
    title: "A first shape",
    body: sourceText.slice(0, 600) + (sourceText.length > 600 ? '…' : ''),
    stone: "Read this back to yourself once."
  };

  return aiJSON(
    `You are helping a thoughtful, sensitive person who struggles with executive dysfunction turn a brain-dump into something finished and useful. They need positive encouragement. They have many ideas and need help landing them. Keep their voice. Never shame. Be warm.

${prompt}

The brain dump:
"""
${sourceText}
"""`,
    fallback
  );
}

window.CandleStore = {
  KEY_ENTRIES, KEY_PARKING, KEY_DRAFT, KEY_TWEAKS,
  uid, hashStr,
  loadEntries, saveEntries,
  loadParking, saveParking,
  loadDraft, saveDraft,
  seedIfEmpty,
  pickEncouragement,
  reflectOnDump, findThemes, craftOutput,
  aiText, aiJSON
};
