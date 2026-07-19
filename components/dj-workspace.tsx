'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Bot, Check, ChevronDown, Cloud, Disc3, Headphones, Library, ListMusic, Mic2, Pause, Play, Radio, Search, SlidersHorizontal, Sparkles, WandSparkles, Wifi, X } from 'lucide-react'

type Track = { title: string; artist: string; bpm: number; key: string; energy: number; time: string; source: string; color: 'cyan' | 'amber' }
type DeckState = { track: Track; playing: boolean; sync: boolean; loop: number; pitch: number }

const tracks: Track[] = [
  { title: 'Neon Current', artist: 'Mira Sol', bpm: 124, key: '8A', energy: 82, time: '5:42', source: 'Local', color: 'cyan' },
  { title: 'After Hours Signal', artist: 'North Phase', bpm: 126, key: '9A', energy: 88, time: '6:18', source: 'Beatport', color: 'amber' },
  { title: 'Glass Cities', artist: 'Aiko Drift', bpm: 122, key: '8B', energy: 71, time: '4:57', source: 'TIDAL', color: 'cyan' },
  { title: 'Low Orbit', artist: 'Vanta & Rue', bpm: 126, key: '9A', energy: 91, time: '5:33', source: 'SoundCloud', color: 'amber' },
  { title: 'Parallel Motion', artist: 'Kinetic Bloom', bpm: 125, key: '7A', energy: 76, time: '6:04', source: 'Dropbox', color: 'cyan' },
]

const initialDecks: DeckState[] = tracks.slice(0, 4).map((track, i) => ({ track, playing: i === 0, sync: i < 2, loop: 8, pitch: i === 0 ? 0 : -0.8 }))

function Waveform({ accent, compact = false }: { accent: string; compact?: boolean }) {
  const bars = [18, 34, 23, 46, 62, 38, 55, 29, 71, 48, 33, 64, 79, 51, 27, 44, 68, 37, 58, 75, 42, 25, 61, 49, 73, 35, 56, 82, 46, 30, 66, 39, 76, 53, 28, 63, 47, 70, 41, 59]
  return <div className={`waveform ${compact ? 'h-9' : 'h-14'}`} aria-label="Track waveform">{bars.map((h, i) => <i key={i} style={{ height: `${h}%`, background: i < 22 ? accent : undefined }} />)}<span /></div>
}

function Knob({ label, value = 0 }: { label: string; value?: number }) {
  return <label className="flex flex-col items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"><span className="knob" style={{ '--turn': `${value}deg` } as React.CSSProperties} /><span>{label}</span></label>
}

function Deck({ index, state, compact, onChange }: { index: number; state: DeckState; compact: boolean; onChange: (next: DeckState) => void }) {
  const accent = state.track.color === 'cyan' ? 'var(--primary)' : 'var(--deck-b)'
  return <section className="panel overflow-hidden" style={{ '--deck': accent } as React.CSSProperties} aria-label={`Deck ${String.fromCharCode(65 + index)}`}>
    <header className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2"><b className="deck-letter">{String.fromCharCode(65 + index)}</b><div className="min-w-0"><h2 className="truncate text-xs font-bold">{state.track.title}</h2><p className="truncate text-[10px] text-muted-foreground">{state.track.artist}</p></div></div>
      <div className="text-right"><b className="font-mono text-lg leading-none" style={{ color: accent }}>{state.track.bpm.toFixed(2)}</b><p className="text-[9px] text-muted-foreground">{state.track.key} · {state.pitch > 0 ? '+' : ''}{state.pitch}%</p></div>
    </header>
    <div className="relative px-3 pt-2"><Waveform accent={accent} compact={compact} /><div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground"><span>02:18.4</span><span>-03:23.6</span></div></div>
    <div className={`flex items-center justify-between gap-2 px-3 ${compact ? 'py-2' : 'py-3'}`}>
      <button className="transport cue" onClick={() => onChange({ ...state, playing: false })}>CUE</button>
      <button className="transport play" style={{ color: accent }} onClick={() => onChange({ ...state, playing: !state.playing })} aria-label={state.playing ? 'Pause' : 'Play'}>{state.playing ? <Pause /> : <Play />}</button>
      <button className={`transport sync ${state.sync ? 'active' : ''}`} onClick={() => onChange({ ...state, sync: !state.sync })}>SYNC</button>
      <div className="flex items-center gap-1 rounded border bg-muted/30 p-1"><button onClick={() => onChange({ ...state, loop: Math.max(1, state.loop / 2) })}>−</button><b className="w-6 text-center font-mono text-[10px]">{state.loop}</b><button onClick={() => onChange({ ...state, loop: Math.min(32, state.loop * 2) })}>+</button></div>
    </div>
    {!compact && <div className="grid grid-cols-4 gap-1 px-3 pb-3">{['HOT CUE','LOOP','STEMS','ROLL'].map((pad,i)=><button key={pad} className={`pad ${i===0?'lit':''}`}><b>{i+1}</b><span>{pad}</span></button>)}</div>}
  </section>
}

function Mixer({ channels }: { channels: number }) {
  return <section className="panel flex min-w-48 flex-col px-2 py-3" aria-label="Mixer"><div className="mb-2 flex items-center justify-between"><span className="section-label">MIXER</span><SlidersHorizontal className="size-3 text-muted-foreground" /></div><div className="flex flex-1 justify-around gap-2">{Array.from({ length: channels }).map((_, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><span className="channel-dot" style={{ background: i % 2 ? 'var(--deck-b)' : 'var(--primary)' }} /><Knob label="Gain" value={i * 18 - 20} /><Knob label="High" value={10} /><Knob label="Mid" value={-15} /><Knob label="Low" value={25} /><div className="relative flex h-20 w-full justify-center"><input aria-label={`Channel ${i + 1} volume`} type="range" min="0" max="100" defaultValue={i === 0 ? 82 : 72} className="vertical-range" /></div><button className="channel-cue">CUE</button></div>)}</div><div className="mt-2"><label className="flex justify-between text-[9px] text-muted-foreground"><span>A</span><span>CROSSFADER</span><span>B</span></label><input aria-label="Crossfader" type="range" defaultValue="50" className="w-full accent-primary" /></div></section>
}

type RemixCandidate = {
  id: string
  title: string
  status: string
  duration: number | null
  artworkUrl: string | null
  audioUrl: string | null
}

const arrangementOptions = ['Keep vocals', 'Extend intro', 'Club outro'] as const

function formatDuration(duration: number | null) {
  if (!duration) return 'Duration pending'
  const minutes = Math.floor(duration / 60)
  return `${minutes}:${String(Math.round(duration % 60)).padStart(2, '0')}`
}

function RemixStudio({ track, onClose }: { track: Track; onClose: () => void }) {
  const [rights, setRights] = useState(false)
  const [status, setStatus] = useState<'setup' | 'processing' | 'done' | 'error'>('setup')
  const [genre, setGenre] = useState('UK Garage')
  const [direction, setDirection] = useState('Underground club')
  const [intensity, setIntensity] = useState(68)
  const [arrangement, setArrangement] = useState<string[]>(['Keep vocals', 'Extend intro'])
  const [candidates, setCandidates] = useState<RemixCandidate[]>([])
  const [error, setError] = useState('')

  const toggleArrangement = (option: string) => {
    setArrangement(current => current.includes(option) ? current.filter(item => item !== option) : [...current, option])
  }

  const generate = async () => {
    if (!rights || status === 'processing') return
    setStatus('processing')
    setError('')

    try {
      const response = await fetch('/api/suno/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: { title: track.title, artist: track.artist, bpm: track.bpm, key: track.key },
          genre,
          direction,
          intensity,
          arrangement,
          rightsConfirmed: rights,
        }),
      })
      const payload = await response.json() as { candidates?: RemixCandidate[]; error?: string }
      if (!response.ok || !payload.candidates?.length) throw new Error(payload.error || 'Suno did not return a playable interpretation.')
      setCandidates(payload.candidates)
      setStatus('done')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The remix request failed. Please retry.')
      setStatus('error')
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="remix-title" className="remix-modal">
    <header className="flex items-start justify-between border-b p-5"><div><p className="eyebrow"><WandSparkles /> SUNO STYLE STUDIO</p><h2 id="remix-title" className="mt-1 text-xl font-bold">Reimagine “{track.title}”</h2><p className="mt-1 text-xs text-muted-foreground">Generate a new interpretation from track metadata and style controls</p></div><button className="icon-button" onClick={onClose} aria-label="Close Remix Studio"><X /></button></header>
    {status === 'setup' && <div className="flex flex-col gap-5 p-5"><div className="source-card"><Disc3 /><div><b>{track.title}</b><p>{track.artist} · {track.bpm} BPM · {track.key}</p></div><span>REFERENCE</span></div><div className="grid grid-cols-2 gap-4"><label className="field">TARGET GENRE<select value={genre} onChange={event => setGenre(event.target.value)}><option>UK Garage</option><option>Afro House</option><option>Drum & Bass</option><option>Melodic Techno</option></select></label><label className="field">STYLE DIRECTION<select value={direction} onChange={event => setDirection(event.target.value)}><option>Underground club</option><option>Festival peak</option><option>Late-night minimal</option><option>Radio edit</option></select></label></div><label className="field">CREATIVE INTENSITY <span>{intensity}%</span><input type="range" min="0" max="100" value={intensity} onChange={event => setIntensity(Number(event.target.value))} /></label><div className="grid grid-cols-3 gap-2">{arrangementOptions.map(option => <label className="option" key={option}><input type="checkbox" checked={arrangement.includes(option)} onChange={() => toggleArrangement(option)} /><span>{option}</span></label>)}</div><p className="remix-note">The source recording is not uploaded. Suno creates an original track using only the displayed metadata and your style choices.</p><label className="rights"><input type="checkbox" checked={rights} onChange={event => setRights(event.target.checked)} /><span><b>I own or control the required rights.</b><small>I confirm I am authorized to use this metadata as creative direction and accept responsibility for the generated result.</small></span></label><button className="primary-action" disabled={!rights} onClick={generate}><Sparkles /> Generate style interpretation</button></div>}
    {status === 'processing' && <div className="processing"><span className="orb"><WandSparkles /></span><h3>Generating a new interpretation</h3><p>Writing arrangement · Producing audio · Preparing candidates</p><div className="progress"><i /></div><small>This can take a few minutes. Keep this window open.</small></div>}
    {status === 'error' && <div className="processing"><span className="error-orb"><X /></span><h3>Generation could not finish</h3><p className="remix-error" role="alert">{error}</p><div className="flex gap-2"><button className="secondary-action" onClick={() => setStatus('setup')}>Edit settings</button><button className="primary-action" onClick={generate}><Sparkles /> Retry</button></div></div>}
    {status === 'done' && <div className="flex flex-col gap-4 p-5"><div className="result-art"><span><Check /></span><div><p>{candidates.length} INTERPRETATION{candidates.length === 1 ? '' : 'S'} READY</p><h3>{genre} · {direction}</h3><small>Original generations based on metadata only</small></div></div><div className="candidate-list">{candidates.map((candidate, index) => <article className="candidate" key={candidate.id}><div className="candidate-heading"><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{candidate.title}</h3><p>{formatDuration(candidate.duration)} · {candidate.status}</p></div></div>{candidate.audioUrl ? <><audio controls preload="none" src={candidate.audioUrl}>Your browser does not support audio playback.</audio><a className="secondary-action candidate-export" href={candidate.audioUrl} download target="_blank" rel="noreferrer">Export audio</a></> : <p className="remix-note">Audio is still processing. Retry generation if it does not become available.</p>}</article>)}</div><div className="flex gap-2"><button className="secondary-action flex-1" onClick={() => setStatus('setup')}>Adjust settings</button><button className="primary-action flex-1" onClick={generate}><Sparkles /> Generate again</button></div><p className="text-center text-[10px] text-muted-foreground">Unofficial Suno API integration. Review provider terms and music rights before distribution.</p></div>}
  </section></div>
}

export function DJWorkspace() {
  const [deckCount, setDeckCount] = useState<2|4>(2), [decks, setDecks] = useState(initialDecks), [query, setQuery] = useState(''), [selected, setSelected] = useState(tracks[1]), [remixOpen, setRemixOpen] = useState(false), [notice, setNotice] = useState('Transition window opens in 24 bars')
  const filtered = useMemo(() => tracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase())), [query])
  const updateDeck = (i:number,next:DeckState) => setDecks(d => d.map((x,j)=>j===i?next:x))
  const loadTrack = (i:number, track:Track) => { updateDeck(i,{...decks[i],track,playing:false}); setNotice(`${track.title} loaded to Deck ${String.fromCharCode(65+i)}`) }
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Image src="/decks-4music2-mark.png" width={32} height={32} alt="4{music}2 brand mark" priority /></span><div className="brand-lockup"><b><em>the</em> decks</b><small>BY <strong>4{'{'}MUSIC{'}'}2</strong> · PERFORMANCE OS</small></div></div><nav className="status-row" aria-label="System status"><span><Wifi /> CLOUD SYNCED</span><span><Headphones /> DDJ-FLX10</span><span><Radio /> 48 kHz / 24-bit</span></nav><div className="flex items-center gap-2"><button className="record-button"><i /> REC</button><div className="deck-toggle" aria-label="Deck layout"><button className={deckCount===2?'active':''} onClick={()=>setDeckCount(2)}>2 DECK</button><button className={deckCount===4?'active':''} onClick={()=>setDeckCount(4)}>4 DECK</button></div><b className="clock">23:41</b></div></header>
    <div className={`performance-grid mode-${deckCount}`}>
      <div className="decks-grid">{decks.slice(0,deckCount).map((d,i)=><Deck key={i} index={i} state={d} compact={deckCount===4} onChange={n=>updateDeck(i,n)} />)}</div><Mixer channels={deckCount}/>
    </div>
    <section className="lower-grid">
      <aside className="sources"><span className="section-label">SOURCES</span>{[[Library,'Collection','12,480'],[ListMusic,'Playlists','24'],[Cloud,'Cloud Drive',''],[Radio,'Streaming','4']].map(([Icon,label,count],i)=>{const I=Icon as typeof Library;return <button key={label as string} className={i===0?'active':''}><I /><span>{label as string}</span><small>{count as string}</small></button>})}<div className="source-divider"/><p>CONNECTED</p>{['Beatport','TIDAL','SoundCloud'].map(x=><button key={x}><i className="online"/><span>{x}</span></button>)}</aside>
      <section className="library-panel"><header className="library-header"><div><p className="eyebrow"><Library /> UNIFIED LIBRARY</p><h2>All Tracks</h2></div><label className="search"><Search /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tracks, artists, keys…" /></label><button className="secondary-action" onClick={()=>setRemixOpen(true)}><WandSparkles /> Remix</button></header><div className="track-table" role="table"><div className="track-row head" role="row"><span>#</span><span>TITLE</span><span>BPM</span><span>KEY</span><span>ENERGY</span><span>SOURCE</span><span>LOAD</span></div>{filtered.map((t,i)=><div role="row" tabIndex={0} className={`track-row ${selected.title===t.title?'selected':''}`} key={t.title} onClick={()=>setSelected(t)} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!e.nativeEvent.isComposing&&e.keyCode!==229){e.preventDefault();setSelected(t)}}}><span>{String(i+1).padStart(2,'0')}</span><span><b>{t.title}</b><small>{t.artist} · {t.time}</small></span><span>{t.bpm}</span><span className="key-pill">{t.key}</span><span><i className="energy"><i style={{width:`${t.energy}%`}}/></i></span><span>{t.source}</span><span className="load-actions" onClick={e=>e.stopPropagation()}>{Array.from({length:deckCount}).map((_,d)=><button key={d} onClick={()=>loadTrack(d,t)} aria-label={`Load ${t.title} to Deck ${String.fromCharCode(65+d)}`}>{String.fromCharCode(65+d)}</button>)}</span></div>)}</div></section>
      <aside className="ai-panel"><header><span><Bot /></span><div><p>PERFORMANCE ASSISTANT</p><b>4music AI is listening</b></div><i /></header><div className="ai-energy"><div className="energy-ring"><b>86</b><small>ENERGY</small></div><div><b>Room is building</b><p>Maintain tension for 32 bars, then lift.</p></div></div><div className="recommendation"><span>NEXT TRACK · 94% FIT</span><h3>Low Orbit</h3><p>Vanta & Rue · 126 BPM · 9A</p><div className="fit-row"><i>KEY +1</i><i>ENERGY +9</i><i>PHRASE ✓</i></div><button onClick={()=>{loadTrack(1,tracks[3]);setNotice('AI recommendation loaded to Deck B')}}>Load to Deck B</button></div><div className="insight"><Sparkles /><p><b>{notice}</b><span>Try a 16-beat loop and cut lows at the next phrase.</span></p></div><button className="ask-ai"><Mic2 /> Ask 4music AI <ChevronDown /></button></aside>
    </section>
    <footer><span>CPU <b>18%</b></span><span>AUDIO <b>3.2 ms</b></span><span>DROPOUTS <b>0</b></span><span className="ml-auto">{'4{music}2 Engine'} <b>Online</b></span></footer>
    {remixOpen && <RemixStudio track={selected} onClose={()=>setRemixOpen(false)} />}
  </main>
}
