// store.jsx — entries, parking lot, themes; localStorage-backed.

const STORE_KEY = 'candleDesk.v1';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { entries: [], parking: [], drafts: {} };
    const parsed = JSON.parse(raw);
    return {
      entries: parsed.entries || [],
      parking: parsed.parking || [],
      drafts: parsed.drafts || {},
    };
  } catch {
    return { entries: [], parking: [], drafts: {} };
  }
}

function saveStore(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('save failed', e);
  }
}

// Naive theme extraction — fallback when AI hasn't tagged an entry yet.
const THEME_HINTS = {
  fog: ['overwhelmed', 'fog', 'tired', 'confused', 'behind', 'stress', 'anxious', 'stuck'],
  joy: ['happy', 'excited', 'joy', 'dance', 'music', 'hope', 'grateful', 'love'],
  body: ['tired', 'sleep', 'body', 'sick', 'sore', 'hungry', 'water'],
  craft: ['write', 'song', 'draw', 'design', 'build', 'code', 'make', 'video'],
  people: ['friend', 'family', 'mom', 'dad', 'partner', 'kid', 'son', 'daughter'],
  money: ['money', 'rent', 'bill', 'pay', 'work', 'job'],
  spirit: ['pray', 'god', 'spirit', 'meaning', 'soul', 'meditate'],
};

function quickThemes(text) {
  const lower = (text || '').toLowerCase();
  const hits = [];
  for (const [theme, words] of Object.entries(THEME_HINTS)) {
    if (words.some((w) => lower.includes(w))) hits.push(theme);
  }
  return hits;
}

function makeEntry(text, extra = {}) {
  const now = new Date();
  return {
    id: 'e_' + now.getTime().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    createdAt: now.toISOString(),
    text: text.trim(),
    tags: extra.tags || quickThemes(text),
    title: extra.title || autoTitle(text),
    reflection: extra.reflection || null,
    outputs: extra.outputs || {},
  };
}

function autoTitle(text) {
  const firstLine = (text || '').trim().split('\n')[0] || '';
  const t = firstLine.replace(/[^\w\s'-]/g, '').trim();
  if (!t) return 'Untitled entry';
  const words = t.split(/\s+/).slice(0, 7).join(' ');
  return words + (t.split(/\s+/).length > 7 ? '…' : '');
}

function formatWhen(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return 'Today, ' + time;
  if (isYesterday) return 'Yesterday, ' + time;
  const days = Math.round((now - d) / (1000 * 60 * 60 * 24));
  if (days < 7) return d.toLocaleDateString([], { weekday: 'long' }) + ', ' + time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: days > 320 ? 'numeric' : undefined });
}

function aggregateThemes(entries) {
  const counts = {};
  for (const e of entries) {
    for (const t of (e.tags || [])) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

Object.assign(window, {
  loadStore, saveStore, makeEntry, quickThemes, formatWhen, aggregateThemes,
});
