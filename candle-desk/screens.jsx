// screens.jsx — Desk, River, Workshop screens.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Voice recognition hook ────────────────────────────────────────────
function useSpeechRecognition({ onText }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const baseRef = useRef('');
  const finalRef = useRef('');

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice not supported here. Open in Chrome or Safari for the mic.');
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setError('Voice paused: ' + (e.error || 'unknown') + '. Your words are still here.');
      setListening(false);
    };
    r.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalRef.current += t + ' ';
        else interim += t;
      }
      const combined = (baseRef.current ? baseRef.current + (baseRef.current.endsWith('\n') ? '' : '\n') : '') + finalRef.current + interim;
      onText(combined);
    };
    recRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, []);

  const start = useCallback((currentText) => {
    if (!recRef.current) return;
    setError(null);
    baseRef.current = currentText || '';
    finalRef.current = '';
    try { recRef.current.start(); } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }, []);

  return { listening, error, start, stop, supported: !!recRef.current };
}

// ─────────────────────────────────────────────────────────────────────
// DESK SCREEN — voice-first dump → calm map → save
// ─────────────────────────────────────────────────────────────────────
function DeskScreen({ store, setStore, toast, onJumpToWorkshop }) {
  const [text, setText] = useState(() => localStorage.getItem('candleDesk.draft') || '');
  const [reflection, setReflection] = useState(null);
  const [reflecting, setReflecting] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null);
  const taRef = useRef(null);

  const { listening, error, start, stop, supported } = useSpeechRecognition({
    onText: (t) => setText(t),
  });

  useEffect(() => {
    localStorage.setItem('candleDesk.draft', text);
  }, [text]);

  const handleMicClick = () => {
    if (listening) stop();
    else start(text);
  };

  const handleReflect = async () => {
    if (!text.trim()) return;
    setReflecting(true);
    try {
      const r = await aiCalmMap(text);
      setReflection(r);
      setEncouragement(r.encouragement || '');
    } catch (e) {
      toast('The candle flickered. Try again.');
      setReflection({
        feeling: 'There may be fog before words.',
        meaning: 'No need to force clarity right now.',
        stone: 'Read what you wrote, slowly, once.',
      });
    } finally {
      setReflecting(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast('Nothing to save yet — write or speak first.');
      return;
    }
    setSaving(true);
    let title = null, tags = null;
    try {
      const tagged = await aiTagEntry(text);
      title = tagged.title;
      tags = tagged.tags;
    } catch {}
    const entry = makeEntry(text, {
      title,
      tags,
      reflection,
    });
    const next = { ...store, entries: [entry, ...store.entries] };
    setStore(next);
    setText('');
    setReflection(null);
    setSavedEntry(entry);
    localStorage.removeItem('candleDesk.draft');
    setSaving(false);
    toast('Saved. The river holds it now.');
    // Quietly fetch encouragement
    aiEncouragement(entry.text).then(s => {
      if (s) setEncouragement(s);
    }).catch(() => {});
  };

  const handlePark = () => {
    if (!text.trim()) return;
    const item = {
      id: 'p_' + Date.now().toString(36),
      text: text.trim().slice(0, 280),
      createdAt: new Date().toISOString(),
    };
    setStore({ ...store, parking: [item, ...store.parking] });
    setText('');
    localStorage.removeItem('candleDesk.draft');
    toast('Parked for later. No rush.');
  };

  const handleClear = () => {
    if (!text.trim()) return;
    if (!confirm('Clear the page? Unsaved words will be lost.')) return;
    setText('');
    setReflection(null);
    localStorage.removeItem('candleDesk.draft');
  };

  const handleDownloadJSON = (entry) => {
    const d = new Date(entry.createdAt);
    const payload = {
      id: entry.id,
      title: entry.title,
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
      createdAt: entry.createdAt,
      tags: entry.tags || [],
      text: entry.text,
      reflection: entry.reflection || null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = (entry.title || 'entry').replace(/[^\w]+/g, '-').toLowerCase().slice(0, 40);
    a.download = `brain-dump-${d.toISOString().slice(0, 10)}-${slug}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Downloaded as JSON.');
  };

  return (
    <div className="desk-stage">
      <div className="surface">
        <p className="desk-prompt">Pour out the river. The page will hold the first shape.</p>

        <div className="mic-stage">
          <button
            className={'mic-button' + (listening ? ' recording' : '')}
            onClick={handleMicClick}
            disabled={!supported}
            aria-label={listening ? 'Stop voice' : 'Start voice'}
          >
            {listening ? 'listening…' : (supported ? 'speak' : 'voice off')}
          </button>
          <p className="mic-status">
            {error || (listening
              ? 'I am here. Take your time.'
              : (supported ? 'Press to speak. Or just write below.' : 'Try Chrome on this device for voice.'))}
          </p>
        </div>

        <textarea
          ref={taRef}
          className="journal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type here. Start anywhere: I am feeling…&#10;&#10;What is on my mind right now…&#10;&#10;An idea that won't leave me alone…"
        />

        <div className="toolbar">
          <button className="btn primary" onClick={handleReflect} disabled={!text.trim() || reflecting}>
            {reflecting ? <span className="thinking"><span className="dot"></span><span className="dot"></span><span className="dot"></span></span> : 'Make a calm map'}
          </button>
          <button className="btn warm" onClick={handleSave} disabled={!text.trim() || saving}>
            {saving ? 'Saving…' : 'Save to river'}
          </button>
          {savedEntry && (
            <button className="btn tiny" onClick={() => handleDownloadJSON(savedEntry)}>
              Download last entry (.json)
            </button>
          )}
          <button className="btn" onClick={handlePark} disabled={!text.trim()}>
            Park for later
          </button>
          <div className="spacer"></div>
          <button className="btn ghost tiny" onClick={handleClear} disabled={!text.trim()}>Clear</button>
        </div>
      </div>

      {reflection && (
        <div>
          {encouragement && <div className="encouragement">{encouragement}</div>}
          <div className="reflection">
            <article className="card">
              <span className="label">Feeling</span>
              <p className="body">{reflection.feeling}</p>
            </article>
            <article className="card">
              <span className="label">Meaning</span>
              <p className="body">{reflection.meaning}</p>
            </article>
            <article className="card">
              <span className="label">Next stone</span>
              <p className="body">{reflection.stone}</p>
            </article>
          </div>
          <div className="toolbar" style={{justifyContent: 'center'}}>
            <button className="btn" onClick={onJumpToWorkshop}>Take this to the Workshop →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// RIVER SCREEN — browse entries, theme map across them
// ─────────────────────────────────────────────────────────────────────
function RiverScreen({ store, setStore, toast, onSendToWorkshop }) {
  const [selectedId, setSelectedId] = useState(store.entries[0]?.id || null);
  const [themeMap, setThemeMap] = useState(null);
  const [weaving, setWeaving] = useState(false);

  const selected = store.entries.find(e => e.id === selectedId) || store.entries[0];

  const localThemes = useMemo(() => aggregateThemes(store.entries), [store.entries]);

  const handleWeave = async () => {
    setWeaving(true);
    try {
      const map = await aiThemeMap(store.entries);
      setThemeMap(map);
    } catch {
      toast('Could not weave the map right now.');
    } finally {
      setWeaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!confirm('Remove this entry from the river?')) return;
    const next = { ...store, entries: store.entries.filter(e => e.id !== id) };
    setStore(next);
    if (selectedId === id) setSelectedId(next.entries[0]?.id || null);
    toast('Removed.');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `candle-desk-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Downloaded. Move it into your Drive or OneDrive.');
  };

  const handleExportEntry = (entry) => {
    const content = [
      entry.title,
      formatWhen(entry.createdAt),
      (entry.tags || []).map(t => '#' + t).join(' '),
      '',
      entry.text,
      '',
      entry.reflection ? `\n— Calm map —\nFeeling: ${entry.reflection.feeling}\nMeaning: ${entry.reflection.meaning}\nNext stone: ${entry.reflection.stone}` : '',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^\w]+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Entry downloaded.');
  };

  if (!store.entries.length) {
    return (
      <div className="surface">
        <p className="river-empty">
          The river is empty.<br />
          Go to the Desk and pour out the first thought.
        </p>
      </div>
    );
  }

  return (
    <div className="river">
      <aside className="river-side surface">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
          <span className="label">River</span>
          <span className="tiny muted">{store.entries.length}</span>
        </div>
        <div className="entry-list">
          {store.entries.map(e => (
            <button
              key={e.id}
              className={'entry-item' + (selected?.id === e.id ? ' active' : '')}
              onClick={() => setSelectedId(e.id)}
            >
              <span className="when">{formatWhen(e.createdAt)}</span>
              <span style={{fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500}}>{e.title}</span>
              <span className="preview">{e.text}</span>
              {e.tags && e.tags.length > 0 && (
                <span className="tags">{e.tags.map(t => <span className="tag" key={t}>{t}</span>)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="theme-map">
          <span className="label">Themes</span>
          <div className="theme-cloud">
            {(themeMap?.themes || localThemes.map(([n, c]) => ({name: n, count: c}))).slice(0, 9).map((t, i) => (
              <span key={i} className="theme-pill">
                {t.name}<span className="count">{t.count}</span>
              </span>
            ))}
            {(themeMap?.themes || localThemes).length === 0 && (
              <span className="muted tiny">No themes yet.</span>
            )}
          </div>
          {themeMap?.throughline && (
            <p style={{marginTop: 12, fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: '0.98rem'}}>
              {themeMap.throughline}
            </p>
          )}
          {themeMap?.buildable && (
            <div className="starter-card" style={{marginTop: 10}}>
              <span className="label">A buildable seed</span>
              <p className="small-stone">{themeMap.buildable}</p>
            </div>
          )}
          <div className="toolbar">
            <button className="btn tiny" onClick={handleWeave} disabled={weaving || store.entries.length < 2}>
              {weaving ? 'Weaving…' : 'Weave themes with AI'}
            </button>
          </div>
        </div>
      </aside>

      <section className="surface">
        {selected && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 10, flexWrap: 'wrap'}}>
              <div style={{flex: '1 1 240px', minWidth: 0}}>
                <h3 style={{fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.7rem', margin: 0, lineHeight: 1.25, wordBreak: 'break-word'}}>{selected.title}</h3>
                <p className="muted tiny" style={{margin: '6px 0 0'}}>{formatWhen(selected.createdAt)}</p>
              </div>
              {selected.tags && selected.tags.length > 0 && (
                <div className="tags" style={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end', flexShrink: 0, maxWidth: '50%'}}>
                  {selected.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                </div>
              )}
            </div>
            <div className="divider"></div>
            <div className="entry-detail">{selected.text}</div>

            {selected.reflection && (
              <div style={{marginTop: 18}}>
                <span className="label">Calm map</span>
                <div className="reflection" style={{marginTop: 8}}>
                  <article className="card"><span className="label">Feeling</span><p className="body">{selected.reflection.feeling}</p></article>
                  <article className="card"><span className="label">Meaning</span><p className="body">{selected.reflection.meaning}</p></article>
                  <article className="card"><span className="label">Next stone</span><p className="body">{selected.reflection.stone}</p></article>
                </div>
              </div>
            )}

            <div className="toolbar">
              <button className="btn primary" onClick={() => onSendToWorkshop(selected.id)}>Send to Workshop →</button>
              <button className="btn" onClick={() => handleExportEntry(selected)}>Download entry</button>
              <div className="spacer"></div>
              <button className="btn ghost tiny" onClick={() => handleDelete(selected.id)}>Remove</button>
            </div>
          </>
        )}

        <div className="divider"></div>
        <div className="toolbar">
          <button className="btn tiny" onClick={handleExport}>Export all (.json) for Drive / OneDrive</button>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WORKSHOP SCREEN — turn dump into outputs + parking lot
// ─────────────────────────────────────────────────────────────────────
const FORMATS = [
  { id: 'journal',  icon: '✒',  name: 'Journal entry',    hint: 'Quiet prose, your voice kept whole' },
  { id: 'article',  icon: '§',  name: 'Substack article', hint: '600–900 words, with a spine' },
  { id: 'tiktok',   icon: '▶',  name: 'TikTok script',    hint: '30–60s, hook + beats' },
  { id: 'product',  icon: '◐',  name: 'Product idea',     hint: 'Smallest buildable form' },
  { id: 'tasks',    icon: '·',  name: 'Next-stone tasks', hint: 'One thing at a time' },
];

function WorkshopScreen({ store, setStore, toast, sourceEntryId, onClearSource }) {
  const sourceEntry = store.entries.find(e => e.id === sourceEntryId);
  const [text, setText] = useState(sourceEntry?.text || '');
  const [format, setFormat] = useState('product');
  const [output, setOutput] = useState('');
  const [working, setWorking] = useState(false);
  const [parkingDraft, setParkingDraft] = useState('');

  useEffect(() => {
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
      const result = await aiTransform(text, format, store.parking);
      setOutput(result);
    } catch (e) {
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
    const ext = format === 'tasks' ? 'md' : 'md';
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `candle-desk-${format}-${stamp}.${ext}`;
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

  return (
    <div className="workshop">
      <aside className="surface">
        <span className="label">Shape it into</span>
        <div className="format-grid" style={{marginTop: 10}}>
          {FORMATS.map(f => (
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
            {working ? <span className="thinking"><span className="dot"></span><span className="dot"></span><span className="dot"></span></span> : `Shape into ${FORMATS.find(f => f.id === format).name.toLowerCase()}`}
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
}

// Tiny markdown renderer — handles headings, bold, italic, lists, paragraphs.
function renderMarkdown(md) {
  if (!md) return '';
  // Escape HTML
  let s = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Headings
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Bold and italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet lists — group consecutive lines
  const lines = s.split('\n');
  const out = [];
  let inList = false;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      out.push('<p>' + para.join(' ') + '</p>');
      para = [];
    }
  };
  for (const line of lines) {
    const m = line.match(/^[-*]\s+(.+)$/);
    if (m) {
      flushPara();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + m[1] + '</li>');
    } else if (line.trim().match(/^<h[23]>/)) {
      flushPara();
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line);
    } else if (line.trim() === '') {
      flushPara();
      if (inList) { out.push('</ul>'); inList = false; }
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      para.push(line);
    }
  }
  flushPara();
  if (inList) out.push('</ul>');
  return out.join('\n');
}

Object.assign(window, {
  DeskScreen, RiverScreen, WorkshopScreen,
});
