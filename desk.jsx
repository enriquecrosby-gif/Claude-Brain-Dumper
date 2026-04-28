/* Candle Desk — Desk screen (write, voice-first, AI reflection) */

const { useState, useEffect, useRef, useCallback } = React;

function useSpeechRecognition(onTranscript) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const baseRef = useRef("");
  const finalRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim += t;
      }
      onTranscript(baseRef.current + finalRef.current + interim);
    };
    recognitionRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [onTranscript]);

  const start = (currentText) => {
    if (!recognitionRef.current) return;
    baseRef.current = currentText ? currentText + (currentText.endsWith(' ') ? '' : ' ') : "";
    finalRef.current = "";
    try { recognitionRef.current.start(); } catch {}
  };
  const stop = () => { try { recognitionRef.current && recognitionRef.current.stop(); } catch {} };

  return { supported, listening, start, stop };
}

const PROMPTS = [
  "What is in your mind right now?",
  "What is the river running through you today?",
  "What's underneath the busyness?",
  "What wants to be witnessed before it is solved?",
  "What did you almost not say out loud?",
  "What is the next small stone?"
];

function pickPrompt() {
  const day = new Date().toDateString();
  const i = Math.abs(window.CandleStore.hashStr(day)) % PROMPTS.length;
  return PROMPTS[i];
}

function Desk({ tone, onSaved, gotoRiver, gotoWorkshop }) {
  const [text, setText] = useState(() => window.CandleStore.loadDraft());
  const [reflection, setReflection] = useState(null);
  const [reflecting, setReflecting] = useState(false);
  const [status, setStatus] = useState("");
  const [encouragement, setEncouragement] = useState(() => window.CandleStore.pickEncouragement(new Date().toDateString()));
  const promptRef = useRef(pickPrompt());

  const onTranscript = useCallback((next) => {
    setText(next);
    window.CandleStore.saveDraft(next);
  }, []);
  const speech = useSpeechRecognition(onTranscript);

  useEffect(() => { window.CandleStore.saveDraft(text); }, [text]);

  const dateLine = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  async function reflect() {
    if (!text.trim()) {
      setStatus("There may be fog before words. Begin with one honest sentence.");
      return;
    }
    setReflecting(true);
    setStatus("The candle is reading slowly…");
    const r = await window.CandleStore.reflectOnDump(text, tone);
    setReflection(r);
    setReflecting(false);
    setStatus("");
  }

  function saveEntry() {
    if (!text.trim()) { setStatus("Nothing to save yet."); return; }
    const entries = window.CandleStore.loadEntries();
    const entry = {
      id: window.CandleStore.uid(),
      createdAt: Date.now(),
      text: text.trim(),
      tags: reflection?.tags || [],
      reflection: reflection ? { feeling: reflection.feeling, meaning: reflection.meaning, stone: reflection.stone } : null
    };
    entries.unshift(entry);
    window.CandleStore.saveEntries(entries);
    window.CandleStore.saveDraft("");
    setText("");
    setReflection(null);
    setStatus("Saved. Your words are kept.");
    onSaved && onSaved(entry);
  }

  function downloadEntry() {
    if (!text.trim()) return;
    const stamp = new Date().toISOString().slice(0,16).replace(/[:T]/g,'-');
    const content = `Candle Desk — ${new Date().toLocaleString()}\n\n${text}${reflection ? `\n\n— Reflection —\nFeeling: ${reflection.feeling}\nMeaning: ${reflection.meaning}\nNext stone: ${reflection.stone}` : ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `candle-desk-${stamp}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded. Drop it into your Drive or OneDrive folder.");
  }

  function exportToCloud(provider) {
    downloadEntry();
    const url = provider === 'drive' ? 'https://drive.google.com/drive/my-drive' : 'https://onedrive.live.com/';
    setTimeout(() => window.open(url, '_blank'), 500);
    setStatus(`Downloaded. Opening ${provider === 'drive' ? 'Google Drive' : 'OneDrive'} — drag the file into your Candle Desk folder.`);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="page-eyebrow">{dateLine} · the desk</div>
        <h1 className="page-title">Pour the river.</h1>
        <p className="page-sub">No performance. No perfect wording. Speak it or write it. The candle holds what you say.</p>
      </header>

      <div className="encourage">"{encouragement}"</div>

      <section className="paper desk-paper">
        <div className="desk-date">
          <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>{text.length ? `${text.trim().split(/\s+/).filter(Boolean).length} words` : 'blank page'}</span>
        </div>

        <p className="desk-prompt">"{promptRef.current}"</p>

        <textarea
          className="journal"
          placeholder="Begin anywhere. The words don't have to make sense yet…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="voice">
          <button
            className="mic-btn"
            data-listening={speech.listening}
            onClick={() => speech.listening ? speech.stop() : speech.start(text)}
            aria-label={speech.listening ? 'Stop voice' : 'Start voice'}
          >
            {speech.listening ? <Icon.Stop size={26} /> : <Icon.Mic size={32} />}
          </button>
          <div className="voice-text">
            <div className="voice-title">{speech.listening ? "Listening…" : speech.supported ? "Speak it out" : "Voice not available here"}</div>
            <div className="voice-hint">
              {speech.listening
                ? "Take your time. The page is patient."
                : speech.supported
                ? "Tap the candle. Speak slowly. Punctuation in your own words."
                : "Open in Chrome on laptop or Safari on iPhone for voice."}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn btn-warm" onClick={reflect} disabled={reflecting}>
            <Icon.Spark /> {reflecting ? "Reflecting…" : "Make a calm map"}
          </button>
          <button className="btn btn-primary" onClick={saveEntry}>
            <Icon.Save /> Keep this entry
          </button>
          <button className="btn" onClick={() => exportToCloud('drive')}>
            <Icon.Cloud /> To Google Drive
          </button>
          <button className="btn" onClick={() => exportToCloud('onedrive')}>
            <Icon.Cloud /> To OneDrive
          </button>
          <button className="btn btn-ghost" onClick={downloadEntry}>
            <Icon.Download /> Download .txt
          </button>
        </div>

        <div className="status">{status}</div>
      </section>

      <section className="reflection">
        <article className={"note" + (reflecting ? " loading" : "")}>
          <div className="note-eyebrow">Feeling</div>
          <p>{reflection?.feeling || "Write or speak first. The map will appear here."}</p>
        </article>
        <article className={"note" + (reflecting ? " loading" : "")}>
          <div className="note-eyebrow">Meaning</div>
          <p>{reflection?.meaning || "The point is not to be efficient. The point is to become clear and kind."}</p>
        </article>
        <article className={"note" + (reflecting ? " loading" : "")}>
          <div className="note-eyebrow">Next stone</div>
          <p>{reflection?.stone || "One small action. Nothing heroic."}</p>
        </article>
      </section>

      {reflection && reflection.tags && reflection.tags.length > 0 && (
        <div className="theme-tags" style={{marginTop: 18}}>
          {reflection.tags.map((t, i) => <span key={i} className="theme-tag">{t}</span>)}
        </div>
      )}

      <div className="quiet-divider">· · ·</div>

      <div className="sync-row">
        <p>Saved on this device. When you're ready, send today's entry to Drive or OneDrive — your river will sync wherever you go.</p>
        <button className="btn btn-ghost" onClick={gotoRiver}><Icon.Journal /> Open the river</button>
        <button className="btn btn-ghost" onClick={gotoWorkshop}><Icon.Box /> Open the workshop</button>
      </div>
    </div>
  );
}

window.Desk = Desk;
