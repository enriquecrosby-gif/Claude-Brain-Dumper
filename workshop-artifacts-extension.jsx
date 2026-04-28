// workshop-artifacts-extension.jsx — adds more Workshop artifact types without disturbing the core screens.

const ORIGINAL_AI_TRANSFORM = window.aiTransform;

const EXTRA_ARTIFACT_PROMPTS = {
  song: {
    maxTokens: 1400,
    buildPrompt: (text, parkingNote) => `You are the music-seed voice of Candle Desk: poetic, concrete, emotional, and useful for AI music generation.

Turn this brain dump into a Suno-ready music artifact. The person likes danceable music, emotional honesty, outsider soul, big beat, breakbeat, melodic trance, sacred melancholy, and music they can dance to.

Return exactly this format:

## [Song title]

**Suno style prompt under 1000 characters:**
[A compact prompt describing mood, feeling, theme, genre/style, vocal vibe, energy arc, and any key sonic details. Do not over-specify instrumentation unless the dump strongly asks for it. Leave room for Suno to be creative. Make it danceable when appropriate.]

**Optional lyric seed:**
[4-8 short lines or a chorus fragment. Keep it singable, simple, emotionally charged.]

**Dance / visual feeling:**
[1-2 sentences describing how this could feel in movement or a short video.]

Rules:
- Keep the Suno style prompt itself under 1000 characters.
- Do not claim the song is finished.
- Do not add a preamble.
- Preserve the emotional truth of the dump.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  image: {
    maxTokens: 1500,
    buildPrompt: (text, parkingNote) => `You are the visual-symbol voice of Candle Desk. You translate a brain dump into a symbolic image prompt.

Return exactly this format:

## [Image title]

**Image prompt:**
[A rich but usable prompt for an AI image generator. Describe subject, setting, mood, symbols, lighting, composition, visual style, and emotional atmosphere. Avoid naming living artists. Keep it coherent enough to generate.]

**Negative / avoid:**
[List 3-6 things to avoid, such as clutter, text artifacts, extra limbs, over-darkness, corporate stock-photo feeling, etc.]

**Symbol key:**
- [symbol]: [what it means]
- [symbol]: [what it means]
- [symbol]: [what it means]

**Possible caption:**
[One short poetic caption.]

Rules:
- Preserve the emotional truth of the dump.
- Do not add a preamble.
- Make the image feel like a threshold into the person's inner world.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  merch: {
    maxTokens: 1700,
    buildPrompt: (text, parkingNote) => `You are the merch-seed voice of Candle Desk. You turn a brain dump into a small, sellable, meaningful object without flattening the soul out of it.

Return exactly this format:

## [Merch concept name]

**Object type:**
[Mug, shirt, sticker, poster, keychain, prayer card, sensory object, etc. Pick one primary object.]

**The core phrase or image:**
[The words, symbol, or visual center of the object.]

**Design direction:**
[2-4 sentences describing mood, colors, texture, typography, symbols, and overall feeling.]

**Who it is for:**
[The person/community who would feel seen by it.]

**Why it matters:**
[One honest paragraph connecting it to the dump.]

**Smallest test:**
[One tiny way to test it this week, like a mockup, TikTok post, or print-on-demand draft.]

Rules:
- Keep it practical and emotionally specific.
- Do not overpromise sales.
- Do not add a preamble.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  live: {
    maxTokens: 1500,
    buildPrompt: (text, parkingNote) => `You are the live-stream producer voice of Candle Desk. You turn a brain dump into a small TikTok Live or short live-set seed.

Return exactly this format:

## [Live theme]

**Opening line:**
[A natural first sentence to say live.]

**The heart of the live:**
[2-3 sentences naming the emotional/spiritual theme.]

**Three talking beats:**
- [beat 1]
- [beat 2]
- [beat 3]

**Movement / music direction:**
[How the creator could dance, move, or choose music around this theme.]

**Battle / gift moment:**
[A short symbolic way to invite interaction without sounding desperate or fake.]

**Closing blessing:**
[One warm closing line.]

Rules:
- Keep it authentic, not salesy.
- Let dance remain central.
- Do not add a preamble.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  dance: {
    maxTokens: 1500,
    buildPrompt: (text, parkingNote) => `You are the movement-ritual voice of Candle Desk. You turn a brain dump into a dance or movement ritual that someone could actually perform.

Return exactly this format:

## [Dance ritual name]

**Emotional center:**
[The feeling being moved through.]

**Music feel:**
[Tempo/genre/vibe suggestions, but leave room for discovery.]

**Movement vocabulary:**
- [gesture or movement 1]
- [gesture or movement 2]
- [gesture or movement 3]
- [gesture or movement 4]

**30-60 second arc:**
[Beginning, middle, ending. Make it filmable.]

**On-screen text:**
[3 short caption options.]

**Why this movement matters:**
[One short paragraph connecting it to the dump.]

Rules:
- Make it embodied and doable.
- Do not make medical claims.
- Do not add a preamble.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  prayer: {
    maxTokens: 1300,
    buildPrompt: (text, parkingNote) => `You are the contemplation voice of Candle Desk. You turn a brain dump into a gentle prayer or contemplative reflection.

Return exactly this format:

## [Contemplation title]

**What is being carried:**
[1-2 sentences naming the burden, longing, or grace in the dump.]

**Short prayer:**
[A brief prayer in warm human language. It may be Christian/Catholic if the dump points that way, but avoid forcing doctrine. Honor mystery.]

**Quiet reflection:**
[One paragraph for contemplation, honest and grounded.]

**One small practice:**
[A tiny practice under 5 minutes: breath, candle, scripture line, silence, walk, stretch, etc.]

**Closing line:**
[One sentence to carry through the day.]

Rules:
- Avoid preachiness.
- Do not add guilt.
- Do not add a preamble.

The dump:
"""
${text}
"""${parkingNote}`,
  },

  landscape: {
    maxTokens: 1800,
    buildPrompt: (text, parkingNote) => `You are the inner-atlas voice of Candle Desk. You turn a brain dump into a symbolic walkable world: city, mountain, desert, ocean, cave, outer space, forest, cathedral, workshop, or other regions that fit.

Return exactly this format:

## [Inner landscape name]

**Where this dump lives:**
[Name the primary region of the inner world, such as city, cave, desert, ocean, mountain, outer space, etc.]

**The place:**
[Describe the environment as if it were a 3D walkable scene.]

**What lives there:**
- [object / creature / structure]: [what it symbolizes]
- [object / creature / structure]: [what it symbolizes]
- [object / creature / structure]: [what it symbolizes]

**What the traveler needs to do there:**
[One small action inside the landscape that represents the next step in real life.]

**Portal to another region:**
[Where this place connects next: city, mountain, cave, ocean, desert, space, etc., and why.]

**Image prompt for this landscape:**
[A compact AI image prompt for generating this inner world scene.]

Rules:
- Make the abstract brain feel like geography.
- Keep it poetic but usable.
- Do not add a preamble.

The dump:
"""
${text}
"""${parkingNote}`,
  },
};

window.aiTransform = async function candleDeskAiTransform(text, format, parking = []) {
  const extra = EXTRA_ARTIFACT_PROMPTS[format];
  if (!extra) {
    return ORIGINAL_AI_TRANSFORM(text, format, parking);
  }

  const parkingNote = parking.length > 0
    ? `\n\nFor context, here are recent parked ideas. Do not force them in; only use them if relevant:\n${parking.slice(0, 8).map(p => '- ' + p.text).join('\n')}`
    : '';

  const prompt = extra.buildPrompt(text, parkingNote);
  return window.ai(prompt, { max_tokens: extra.maxTokens });
};

const WORKSHOP_FORMATS_EXTENDED = [
  { id: 'journal',   icon: '✒',  name: 'Journal entry',     hint: 'Quiet prose, your voice kept whole' },
  { id: 'article',   icon: '§',  name: 'Substack article',  hint: '600-900 words, with a spine' },
  { id: 'tiktok',    icon: '▶',  name: 'TikTok script',     hint: '30-60s, hook + beats' },
  { id: 'song',      icon: '♫',  name: 'Song prompt',       hint: 'Suno seed, mood + lyrics' },
  { id: 'image',     icon: '✧',  name: 'Image prompt',      hint: 'Symbolic visual seed' },
  { id: 'merch',     icon: '◈',  name: 'Merch concept',     hint: 'Mugs, shirts, posters' },
  { id: 'live',      icon: '◌',  name: 'Live stream seed',  hint: 'Theme, beats, blessing' },
  { id: 'dance',     icon: '↝',  name: 'Dance ritual',      hint: 'Movement + video arc' },
  { id: 'prayer',    icon: '✚',  name: 'Contemplation',     hint: 'Prayer, practice, line' },
  { id: 'landscape', icon: '⌂',  name: 'Inner landscape',   hint: 'World map from the dump' },
  { id: 'product',   icon: '◐',  name: 'Product idea',      hint: 'Smallest buildable form' },
  { id: 'tasks',     icon: '·',  name: 'Next-stone tasks',  hint: 'One thing at a time' },
];

window.WorkshopScreen = function CandleDeskWorkshopScreen({ store, setStore, toast, sourceEntryId, onClearSource }) {
  const sourceEntry = store.entries.find(e => e.id === sourceEntryId);
  const [text, setText] = React.useState(sourceEntry?.text || '');
  const [format, setFormat] = React.useState('song');
  const [output, setOutput] = React.useState('');
  const [working, setWorking] = React.useState(false);
  const [parkingDraft, setParkingDraft] = React.useState('');

  React.useEffect(() => {
    if (sourceEntry) setText(sourceEntry.text);
  }, [sourceEntryId]);

  const handleTransform = async () => {
    if (!text.trim()) {
      toast('Nothing to shape yet. Bring something from the River, or paste here.');
      return;
    }
    setWorking(true);
    setOutput('');
    try {
      const result = await window.aiTransform(text, format, store.parking);
      setOutput(result);
    } catch (e) {
      console.error('Workshop transform failed:', e);
      toast('The candle flickered. Try again.');
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast('Copied.');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `candle-desk-${format}-${stamp}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Downloaded.');
  };

  const handleAddPark = () => {
    if (!parkingDraft.trim()) return;
    const item = {
      id: 'p_' + Date.now().toString(36),
      text: parkingDraft.trim(),
      createdAt: new Date().toISOString(),
    };
    setStore({ ...store, parking: [item, ...store.parking] });
    setParkingDraft('');
  };

  const handleRemovePark = (id) => {
    setStore({ ...store, parking: store.parking.filter(p => p.id !== id) });
  };

  const selectedFormat = WORKSHOP_FORMATS_EXTENDED.find(f => f.id === format) || WORKSHOP_FORMATS_EXTENDED[0];

  return (
    <div className="workshop">
      <aside className="surface">
        <span className="label">Shape it into</span>
        <div className="format-grid" style={{marginTop: 10}}>
          {WORKSHOP_FORMATS_EXTENDED.map(f => (
            <button
              key={f.id}
              className={'format-card' + (format === f.id ? ' active' : '')}
              onClick={() => setFormat(f.id)}
            >
              <span className="icon">{f.icon}</span>
              <span className="name">{f.name}</span>
              <span className="hint">{f.hint}</span>
            </button>
          ))}
        </div>

        <div className="parking-lot">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className="label">Parking lot</span>
            <span className="tiny muted">{store.parking.length}</span>
          </div>
          <p className="muted tiny" style={{margin: '4px 0 10px'}}>
            Capture without commitment. The pile is allowed to stay.
          </p>
          <div style={{display: 'flex', gap: 6}}>
            <input
              type="text"
              value={parkingDraft}
              onChange={(e) => setParkingDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPark()}
              placeholder="A loose idea, no pressure…"
              className="journal"
              style={{minHeight: 0, height: 36, padding: '0 12px', fontSize: '0.95rem', lineHeight: '36px', background: 'var(--paper)'}}
            />
            <button className="btn tiny" onClick={handleAddPark} disabled={!parkingDraft.trim()}>Park</button>
          </div>
          <div style={{marginTop: 10, maxHeight: 240, overflowY: 'auto'}}>
            {store.parking.length === 0 ? (
              <p className="muted tiny" style={{fontStyle: 'italic'}}>Nothing parked yet.</p>
            ) : store.parking.map(p => (
              <div key={p.id} className="parking-item">
                <span style={{flex: 1}}>{p.text}</span>
                <button className="x" onClick={() => handleRemovePark(p.id)} aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="surface workshop-output">
        {sourceEntry && (
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
            <span className="muted tiny">From: <em>{sourceEntry.title}</em></span>
            <button className="btn ghost tiny" onClick={onClearSource}>Use a different dump</button>
          </div>
        )}

        {!sourceEntry && (
          <textarea
            className="journal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a brain dump here, or send one over from the River..."
            style={{minHeight: 140}}
          />
        )}

        <div className="toolbar">
          <button className="btn primary" onClick={handleTransform} disabled={working || !text.trim()}>
            {working ? <span className="thinking"><span className="dot"></span><span className="dot"></span><span className="dot"></span></span> : `Shape into ${selectedFormat.name.toLowerCase()}`}
          </button>
        </div>

        <div className="divider"></div>

        {output ? (
          <>
            <div className="output-display" dangerouslySetInnerHTML={{__html: renderMarkdown(output)}}></div>
            <div className="toolbar">
              <button className="btn" onClick={handleCopy}>Copy</button>
              <button className="btn" onClick={handleDownload}>Download (.md)</button>
              <div className="spacer"></div>
              <button className="btn ghost tiny" onClick={() => setOutput('')}>Clear output</button>
            </div>
          </>
        ) : (
          <div className="output-empty">
            {working ? (
              <span className="thinking"><span className="dot"></span><span className="dot"></span><span className="dot"></span></span>
            ) : (
              <span>Choose a format and press shape.<br/>The AI will draft something you can finish.</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
