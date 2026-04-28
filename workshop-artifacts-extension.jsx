// workshop-artifacts-extension.jsx — adds more Workshop artifact types without disturbing the core screens.

const ORIGINAL_AI_TRANSFORM = window.aiTransform;

window.aiTransform = async function candleDeskAiTransform(text, format, parking = []) {
  if (format !== 'song') {
    return ORIGINAL_AI_TRANSFORM(text, format, parking);
  }

  const parkingNote = parking.length > 0
    ? `\n\nFor context, here are recent parked ideas. Do not force them in; only use them if relevant:\n${parking.slice(0, 8).map(p => '- ' + p.text).join('\n')}`
    : '';

  const prompt = `You are the music-seed voice of Candle Desk: poetic, concrete, emotional, and useful for AI music generation.

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
"""${parkingNote}`;

  return window.ai(prompt, { max_tokens: 1400 });
};

const WORKSHOP_FORMATS_EXTENDED = [
  { id: 'journal',  icon: '✒',  name: 'Journal entry',    hint: 'Quiet prose, your voice kept whole' },
  { id: 'article',  icon: '§',  name: 'Substack article', hint: '600–900 words, with a spine' },
  { id: 'tiktok',   icon: '▶',  name: 'TikTok script',    hint: '30–60s, hook + beats' },
  { id: 'song',     icon: '♫',  name: 'Song prompt',      hint: 'Suno seed, mood + lyrics' },
  { id: 'product',  icon: '◐',  name: 'Product idea',     hint: 'Smallest buildable form' },
  { id: 'tasks',    icon: '·',  name: 'Next-stone tasks', hint: 'One thing at a time' },
];

window.WorkshopScreen = function CandleDeskWorkshopScreen({ store, setStore, toast, sourceEntryId, onClearSource }) {
  const sourceEntry = store.entries.find(e => e.id === sourceEntryId);
  const [text, setText] = React.useState(sourceEntry?.text || '');
  const [format, setFormat] = React.useState('product');
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
            placeholder="Paste a brain dump here, or send one over from the River…"
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
