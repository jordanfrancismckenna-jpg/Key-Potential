/* Rhythm Trainer — tab 3 of the guitar app.
 * Uses the page's metronome (shared AudioContext, BPM and subdivision), rhythm-core.js for the maths,
 * VexFlow (vendored, loaded on first open) for engraving. Audio is scheduled on the Web Audio clock. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const EMBED = window.parent && window.parent !== window;
  const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());

  const MODES = {
    learn: { name: 'Learn', help: 'Notation, counting and strum directions. Listen, then play along with it.' },
    memory: { name: 'Memory', help: 'Hear it, then the notation hides. Play it back from memory over the click, then reveal and check.' },
    sight: { name: 'Sight-read', help: 'No demo. After the count-in, play it straight off the page, then hear the correct version.' },
    call: { name: 'Call & resp.', help: 'It plays a bar, you answer with a bar. Back and forth, same rhythm or a new one each time.' },
  };
  const WITH = { muted: 'Muted strings', chord: 'One chord', prog: 'Progression', scale: 'Scale' };

  let P = null; // progress + settings (synced to The Key)
  const RT = { ex: null, shown: null, visible: true, daily: null, lastRun: null, loaded: false, open: false };
  const S = () => P.settings;
  const DEF = { mode: 'learn', src: 'gen', lib: 'pop-oldfaithful', genre: 'Acoustic pop', loop: true, metVol: 70, rhyVol: 80, sound: 'strum', demo: 2, you: 2, crFresh: false, crShow: true, sightFresh: false, g: { strum: true, count: true, acc: true, ghost: true }, with: 'muted', sens: 'med', mic: false };

  // ═════════ persistence ═════════
  function localGet() { try { return JSON.parse(localStorage.getItem('caged:rhythm') || 'null'); } catch (e) { return null; } }
  function load(cb) {
    const fin = (d) => { P = d && d.v ? d : RC.newProgress(); P.settings = Object.assign({}, DEF, P.settings || {}); P.settings.g = Object.assign({}, DEF.g, P.settings.g || {}); cb(); };
    if (!EMBED) return fin(localGet());
    let done = false;
    const h = (e) => { if (e.origin !== location.origin || !e.data || e.data.type !== 'tk-rhythm-data') return; done = true; window.removeEventListener('message', h); fin(e.data.data); };
    window.addEventListener('message', h);
    try { parent.postMessage({ type: 'tk-rhythm-load' }, location.origin); } catch (e) {}
    setTimeout(() => { if (!done) { window.removeEventListener('message', h); fin(localGet()); } }, 900);
  }
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (EMBED) { try { parent.postMessage({ type: 'tk-rhythm-save', data: P }, location.origin); return; } catch (e) {} }
      try { localStorage.setItem('caged:rhythm', JSON.stringify(P)); } catch (e) {}
    }, 300);
  }
  function reportSeconds(sec) {
    if (sec < 5) return;
    const d = todayStr();
    RC.addSeconds(P, d, Math.round(sec));
    save();
    if (EMBED) try { parent.postMessage({ type: 'tk-guitar-seconds', sec: Math.round(sec), date: d }, location.origin); } catch (e) {}
  }
  const calGet = () => { try { return JSON.parse(localStorage.getItem('caged:rt-cal') || 'null'); } catch (e) { return null; } };
  const calSet = (c) => { try { localStorage.setItem('caged:rt-cal', JSON.stringify(c)); } catch (e) {} };

  // ═════════ shared metronome glue ═════════
  const getBpm = () => bpm; // global from the metronome
  function setBpm(v) {
    bpm = Math.max(30, Math.min(260, Math.round(v)));
    const a = $('#bpmDisplay'), b = $('#metBpmLabel'), c = $('#rtBpmV');
    if (a) a.textContent = bpm; if (b) b.textContent = bpm; if (c) c.textContent = bpm;
  }
  function wrapGlobals() {
    const sm = window.startMetronome, ab = window.adjustBpm, tt = window.tapTempo;
    window.startMetronome = function () { if (E.running) stop(true); return sm.apply(this, arguments); };
    window.adjustBpm = function () { const r = ab.apply(this, arguments); syncBpm(); return r; };
    window.tapTempo = function () { const r = tt.apply(this, arguments); syncBpm(); return r; };
  }
  const syncBpm = () => { const c = $('#rtBpmV'); if (c) c.textContent = getBpm(); };

  // ═════════ UI skeleton ═════════
  function mount() {
    const host = $('#tab3');
    host.innerHTML = `
      <div id="rtDaily" class="rt-daily"></div>
      <div class="rt-seg" id="rtModes" style="grid-template-columns:repeat(4,1fr)">${Object.entries(MODES).map(([k, m]) => `<button data-mode="${k}">${m.name}</button>`).join('')}</div>
      <p class="rt-help" id="rtHelp"></p>
      <div class="rt-card" id="rtCard">
        <div class="rt-head"><div><div class="rt-title" id="rtTitle"></div><div class="rt-meta" id="rtMeta"></div></div><span class="rt-pill" id="rtPill">Ready</span></div>
        <div class="rt-with" id="rtWith"></div>
        <div class="rt-status" id="rtStatus"></div>
        <div id="rtScore"><div class="rt-loading">Loading notation…</div></div>
        <div class="rt-hidden" id="rtHidden"><div class="q">🙈</div><div><b>Notation hidden</b></div><div class="tiny" style="font-size:12px;margin-top:4px">Play it back from memory</div><div class="row"><button class="rt-btn small" id="rtReveal">Reveal</button><button class="rt-btn small" id="rtListen">Listen again</button></div></div>
        <div class="rt-tip" id="rtTip"></div>
      </div>
      <div class="rt-transport">
        <button class="rt-tbtn" id="rtNew"><span class="ic">↻</span>New</button>
        <button class="rt-play" id="rtPlay">▶ Play</button>
        <button class="rt-tbtn" id="rtLoop"><span class="ic">⟳</span>Loop</button>
      </div>
      <div class="rt-bpm"><button class="rt-adj" data-bpm="-5">−</button><button class="rt-adj" data-bpm="-1" style="width:36px;font-size:15px">‹</button><div><div class="v" id="rtBpmV">90</div><div class="l" id="rtBpmL">♩ = BPM · tap</div></div><button class="rt-adj" data-bpm="1" style="width:36px;font-size:15px">›</button><button class="rt-adj" data-bpm="5">+</button></div>
      <div class="rt-rate" id="rtRate"></div>
      <details class="rt-sec" id="rtExSec" open><summary>Exercise</summary><div class="body" id="rtExBody"></div></details>
      <details class="rt-sec"><summary>Strumming guide</summary><div class="body" id="rtGuideBody"></div></details>
      <details class="rt-sec"><summary>Sound</summary><div class="body" id="rtSoundBody"></div></details>
      <details class="rt-sec" id="rtMicSec"><summary>Mic assessment</summary><div class="body" id="rtMicBody"></div></details>
      <details class="rt-sec" id="rtProgSec"><summary>Progress</summary><div class="body" id="rtProgBody"></div></details>`;
    host.addEventListener('click', onClick);
    host.addEventListener('input', onInput);
    $('#rtBpmV').parentElement.addEventListener('click', () => { window.tapTempo(); });
    $('#rtProgSec').addEventListener('toggle', (e) => { if (e.target.open) renderProgress(); });
    window.addEventListener('resize', () => { clearTimeout(RT.rz); RT.rz = setTimeout(() => RT.open && renderScore(), 150); });
  }

  // ═════════ exercises ═════════
  function newExercise() {
    const st = S();
    if (RT.daily) return RT.daily.plan[RT.daily.i].ex;
    if (st.src === 'lib') { const p = RC.LIB.find((x) => x.id === st.lib) || RC.LIB[0]; return RC.libraryExercise(p); }
    return RC.generate({ level: P.level, bars: P.bars || 1, adapt: RC.adaptWeights(P) });
  }
  function setExercise(ex, opts) {
    RT.ex = ex; RT.shown = ex; RT.visible = true; RT.marks = null;
    if (!(opts && opts.keepBpm)) {
      if (ex.src === 'lib') setBpm(Math.round(ex.bpm * 0.85 / 2) * 2);
      else if (!RT.daily && opts && opts.levelChange) setBpm(P.comfort[P.level] || RC.LEVELS[P.level - 1].bpm);
    }
    hideRate();
    renderHead(); renderScore(); renderStatus('', '');
  }

  // ═════════ header / meta ═════════
  function tsLabel(ts) { return ts.endsWith('/8') && ts !== '7/8' ? '♩. = BPM' : '♩ = BPM'; }
  function renderHead() {
    const ex = RT.shown, st = S();
    const d = RT.daily && RT.daily.plan[RT.daily.i];
    $('#rtTitle').textContent = d ? `Step ${RT.daily.i + 1}/5 · ${d.title}` : ex.src === 'lib' ? `${ex.genre} · ${ex.name}` : `Level ${ex.level} · ${RC.LEVELS[ex.level - 1].name}`;
    $('#rtMeta').textContent = `${ex.ts} · ${ex.bars.length} bar${ex.bars.length > 1 ? 's' : ''}${ex.swing ? ' · swung quavers' : ''}${ex.src === 'lib' ? ` · target ${ex.bpm}` : ''}`;
    $('#rtBpmL').textContent = tsLabel(ex.ts) + ' · tap';
    $('#rtTip').textContent = d ? d.blurb : ex.tip || '';
    $('#rtWith').innerHTML = withLine();
    $$('#rtModes button').forEach((b) => b.classList.toggle('active', b.dataset.mode === curMode()));
    $('#rtHelp').textContent = MODES[curMode()].help;
    $('#rtLoop').classList.toggle('on', !!st.loop);
    $('#rtLoop').style.visibility = RT.daily ? 'hidden' : '';
    $('#rtNew').disabled = !!RT.daily || E.running;
    $('#rtModes').style.pointerEvents = RT.daily ? 'none' : ''; $('#rtModes').style.opacity = RT.daily ? '.55' : '';
  }
  const curMode = () => (RT.daily ? RT.daily.plan[RT.daily.i].mode : S().mode);
  function chordAt(n) {
    const st = S();
    if (st.with === 'chord') return chordDisplayName({ keyIdx, quality });
    if (st.with === 'prog' && progChords.length) return chordDisplayName(progChords[n % progChords.length]);
    return null;
  }
  function withLine() {
    const st = S();
    if (st.with === 'muted') return '✋ <b>Muted strings</b>: rest your fretting hand lightly across the strings.';
    if (st.with === 'chord') return `🎸 <b>One chord: ${esc(chordDisplayName({ keyIdx, quality }))}</b> (change it on the Practice tab).`;
    if (st.with === 'prog') return progChords.length ? `🎼 <b>Progression</b>: ${progChords.map((c) => esc(chordDisplayName(c))).join(' → ')}. One chord per bar.` : '🎼 <b>Progression</b>: add chords on the Progression tab first.';
    const k = NOTE_DISPLAY[keyIdx];
    return `≡ <b>Scale: ${esc(k)} ${quality === 'minor' ? 'natural minor' : 'major'}</b>. One note per strum, up then down the scale.`;
  }

  // ═════════ notation (VexFlow) ═════════
  function vfDur(e) { return { w: 'w', h: 'h', q: 'q', e: '8', s: '16' }[e.base] + (e.dots ? 'd' : '') + (e.rest ? 'r' : ''); }
  function renderScore() {
    const host = $('#rtScore');
    if (!window.Vex || !RT.shown) return;
    const showing = RT.visible;
    $('#rtHidden').classList.toggle('show', !showing);
    host.style.display = showing ? '' : 'none';
    if (!showing) return;
    host.innerHTML = '';
    const VF = Vex.Flow, ex = RT.shown, st = S();
    const W = Math.max(300, host.clientWidth || 360);
    const perRow = W >= 640 && ex.bars.length > 1 ? 2 : 1;
    const scale = W < 380 ? 1.1 : W < 460 ? 1.2 : 1.32;
    const iw = W / scale;
    const guideOn = st.g.strum || st.g.count;
    const chordH = chordAt(0) ? 16 : 0;
    const top = 18 + chordH;
    const rowH = top + 40 + 22 + (st.g.strum ? 20 : 0) + (st.g.count ? 18 : 0) + 8;
    const rows = Math.ceil(ex.bars.length / perRow);
    const r = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    r.resize(W, Math.ceil(rows * rowH * scale) + 6);
    const ctx = r.getContext();
    ctx.scale(scale, scale);
    const svg = host.querySelector('svg');
    const NS = 'http://www.w3.org/2000/svg';
    const txt = (x, y, s, attrs) => { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.textContent = s; Object.entries(attrs || {}).forEach(([k, v]) => t.setAttribute(k, v)); return t; };
    RT.notes = []; RT.slotEls = [];
    const allNotes = [];
    const bw = (iw - 8) / perRow;
    ex.bars.forEach((bar, bi) => {
      const row = Math.floor(bi / perRow), col = bi % perRow;
      const x = 4 + col * bw, y0 = row * rowH;
      const stave = new VF.Stave(x, y0 + top, bw, { space_above_staff_ln: 2 });
      stave.setConfigForLines([0, 1, 2, 3, 4].map((i) => ({ visible: i === 2 })));
      if (bi === 0) stave.addTimeSignature(bar.ts);
      if (bi === ex.bars.length - 1) stave.setEndBarType(st.loop && !RT.daily ? VF.Barline.type.REPEAT_END : VF.Barline.type.END);
      stave.setContext(ctx).draw();
      const lineY = stave.getYForLine(2);
      const ch = chordAt(bi);
      if (ch) svg.appendChild(txt(x + (bi === 0 ? 34 : 10), y0 + 13 , ch, { 'font-size': 14, 'font-weight': 700, fill: '#1e293b', 'font-family': '-apple-system,Segoe UI,Roboto,sans-serif' }));
      const notes = bar.ev.map((e, ei) => {
        const n = new VF.StaveNote({ keys: ['b/4'], duration: vfDur(e), stem_direction: 1, auto_stem: false });
        if (e.dots) VF.Dot.buildAndAttach([n], { all: true });
        if (e.acc && st.g.acc) n.addModifier(new VF.Articulation('a>').setPosition(VF.Modifier.Position.BELOW));
        n.setAttribute('id', `rt-${bi}-${ei}`);
        return n;
      });
      RT.notes[bi] = notes;
      notes.forEach((n) => allNotes.push(n));
      // beams: per beat group, consecutive beamable notes; rests break the beam
      const beams = [];
      const groups = RC.meter(bar.ts).groups;
      let gs = 0;
      groups.forEach((g) => {
        let run = [];
        const flush = () => { if (run.length >= 2) beams.push(new VF.Beam(run)); run = []; };
        bar.ev.forEach((e, ei) => {
          if (e.t < gs || e.t >= gs + g) return;
          const beamable = !e.rest && (e.base === 'e' || e.base === 's') && e.t + e.d <= gs + g;
          if (beamable) run.push(notes[ei]); else flush();
        });
        flush();
        gs += g;
      });
      // tuplets
      const tups = {};
      bar.ev.forEach((e, ei) => { if (e.tup) (tups[e.tup.id] = tups[e.tup.id] || { t: e.tup, n: [] }).n.push(notes[ei]); });
      const tuplets = Object.values(tups).map((tp) => {
        const beamedAll = beams.some((b) => tp.n.every((n) => b.getNotes().includes(n)));
        return new VF.Tuplet(tp.n, { num_notes: tp.t.n, notes_occupied: tp.t.occ, bracketed: !beamedAll, ratioed: false });
      });
      const m = RC.meter(bar.ts);
      const voice = new VF.Voice({ num_beats: m.num, beat_value: m.den }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
      new VF.Formatter().joinVoices([voice]).format([voice], Math.max(80, stave.getNoteEndX() - stave.getNoteStartX() - 30));
      // proportional spacing: x follows time (so counts and arrows sit evenly), with a minimum gap so glyphs never collide
      {
        const startX = stave.getNoteStartX(), avail = stave.getNoteEndX() - startX - 22, pad = 10;
        const want = bar.ev.map((e) => pad + (e.t / bar.len) * (avail - pad));
        const minGap = (e) => (e.dots ? 17 : 14);
        for (let i = 1; i < want.length; i++) want[i] = Math.max(want[i], want[i - 1] + minGap(bar.ev[i - 1]));
        const over = want.length ? want[want.length - 1] - (avail - 6) : 0;
        if (over > 0) { const k = (avail - 6 - pad) / (want[want.length - 1] - pad); for (let i = 0; i < want.length; i++) want[i] = pad + (want[i] - pad) * k; }
        notes.forEach((n, i) => n.getTickContext().setX(want[i]));
      }
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      tuplets.forEach((t) => t.setContext(ctx).draw());
      // tick → x map for the guide row
      const anchors = bar.ev.map((e, ei) => [e.t, notes[ei].getAbsoluteX() + 5.5]);
      // after the last note, continue at the bar's average spacing (VexFlow leaves little room before the barline)
      { const f = anchors[0], l = anchors[anchors.length - 1]; const ppt = l[0] > f[0] ? (l[1] - f[1]) / (l[0] - f[0]) : (stave.getNoteEndX() - f[1]) / bar.len; anchors.push([bar.len, Math.min(stave.getNoteEndX() + 6, l[1] + (bar.len - l[0]) * ppt)]); }
      const xAt = (t) => { for (let i = 0; i < anchors.length - 1; i++) { const [t0, x0] = anchors[i], [t1, x1] = anchors[i + 1]; if (t >= t0 && t <= t1) return x0 + ((t - t0) / (t1 - t0 || 1)) * (x1 - x0); } return anchors[anchors.length - 1][1]; };
      RT.slotEls[bi] = [];
      if (guideOn) {
        const slots = RC.guide(bar, { allDown: ex.allDown });
        const gy = lineY + 36;
        slots.forEach((s) => {
          const show = s.type === 'hit' || s.type === 'accent' || st.g.ghost;
          const g = document.createElementNS(NS, 'g');
          g.setAttribute('class', 'rt-slot');
          const X = xAt(s.t);
          if (st.g.strum && show) {
            const hit = s.type === 'hit' || s.type === 'accent';
            const glyph = s.type === 'mute' ? '×' : s.dir === 'D' ? '↓' : '↑';
            g.appendChild(txt(X, gy, glyph, { class: 'rt-dir', 'text-anchor': 'middle', 'font-size': s.type === 'accent' && st.g.acc ? 17 : s.type === 'mute' ? 13 : 15, 'font-weight': hit ? 800 : 400, fill: s.type === 'accent' && st.g.acc ? '#E14B4A' : hit ? '#1e293b' : '#94a3b8', opacity: hit ? 1 : 0.55, 'font-family': '-apple-system,Segoe UI,Roboto,sans-serif' }));
          }
          if (st.g.count) {
            const hit = s.type === 'hit' || s.type === 'accent';
            g.appendChild(txt(X, st.g.strum ? gy + 19 : gy + 2, s.count, { class: 'rt-cnt', 'text-anchor': 'middle', 'font-size': s.strong ? 12.5 : 10.5, 'font-weight': s.strong ? 700 : 500, fill: hit ? '#1e293b' : '#94a3b8', 'font-family': 'SF Mono,Menlo,Consolas,monospace' }));
          }
          svg.appendChild(g);
          RT.slotEls[bi].push({ t: s.t, el: g });
        });
      }
    });
    // ties (within and across bars / rows)
    const flat = [];
    ex.bars.forEach((b, bi) => b.ev.forEach((e, ei) => flat.push({ e, n: RT.notes[bi][ei], row: Math.floor(bi / perRow) })));
    flat.forEach((f, i) => {
      if (!f.e.tieNext || !flat[i + 1]) return;
      const nx = flat[i + 1];
      if (nx.row === f.row) new VF.StaveTie({ first_note: f.n, last_note: nx.n, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
      else { new VF.StaveTie({ first_note: f.n, last_note: null, first_indices: [0], last_indices: [0] }).setContext(ctx).draw(); new VF.StaveTie({ first_note: null, last_note: nx.n, first_indices: [0], last_indices: [0] }).setContext(ctx).draw(); }
    });
    if (ex.swing) svg.appendChild(txt(iw - 6, 12, 'Swing  ♪♪ = ♩³♪', { 'text-anchor': 'end', 'font-size': 11, 'font-style': 'italic', fill: '#475569' }));
    RT.noteEl = (bi, ei) => document.getElementById(`vf-rt-${bi}-${ei}`);
    if (RT.marks) applyMarks(RT.marks);
  }
  function clearHi() { $$('#rtScore .rt-on').forEach((x) => x.classList.remove('rt-on')); $$('#rtScore .rt-slot.on').forEach((x) => x.classList.remove('on')); }

  // ═════════ audio ═════════
  const A = {};
  function audioSetup() {
    ensureCtx();
    if (!A.out) {
      A.out = audioCtx.createGain(); A.out.connect(audioCtx.destination);
      const len = Math.floor(audioCtx.sampleRate * 0.3);
      A.noise = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = A.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    applyVolumes();
  }
  function applyVolumes() {
    if (!E.met) return;
    const st = S();
    E.met.gain.value = Math.pow(st.metVol / 100, 1.6) * 1.1;
    E.rhy.gain.value = Math.pow(st.rhyVol / 100, 1.6) * 1.2;
  }
  function click(time, level, dest) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = level === 2 ? 1500 : level === 1 ? 1000 : 2200;
    const v = level === 2 ? 0.55 : level === 1 ? 0.33 : 0.12;
    g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(g); g.connect(dest); o.start(time); o.stop(time + 0.06);
  }
  function strum(time, acc, dir, dest) {
    const st = S();
    if (st.sound === 'block') {
      [[acc ? 1350 : 1150, 1], [acc ? 2700 : 2300, 0.25]].forEach(([f, k]) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime((acc ? 0.7 : 0.42) * k, time + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
        o.connect(g); g.connect(dest); o.start(time); o.stop(time + 0.08);
      });
      return;
    }
    // muted strum: a filtered noise "scratch" spread over ~12 ms (the pick crossing six strings) plus a low body thump
    const src = audioCtx.createBufferSource(); src.buffer = A.noise;
    const bp = audioCtx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = dir === 'U' ? 2600 : 1700; bp.Q.value = 0.9;
    const g = audioCtx.createGain(); const pk = acc ? 0.95 : dir === 'U' ? 0.42 : 0.6;
    g.gain.setValueAtTime(0.0001, time); g.gain.linearRampToValueAtTime(pk, time + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, time + (acc ? 0.11 : 0.07));
    src.connect(bp); bp.connect(g); g.connect(dest); src.start(time, Math.random() * 0.1); src.stop(time + 0.13);
    const o = audioCtx.createOscillator(), og = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(dir === 'U' ? 165 : 110, time); o.frequency.exponentialRampToValueAtTime(70, time + 0.05);
    og.gain.setValueAtTime(0.0001, time); og.gain.linearRampToValueAtTime((acc ? 0.5 : 0.3) * (dir === 'U' ? 0.6 : 1), time + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    o.connect(og); og.connect(dest); o.start(time); o.stop(time + 0.09);
  }

  // ═════════ engine: a plan yields bar steps, scheduled ahead on the audio clock ═════════
  const E = { running: false };
  function tickSec(ts) { const b = getBpm(); return ts.endsWith('/8') && ts !== '7/8' ? 60 / b / 18 : 60 / b / 12; }
  function start(plan, info) {
    audioSetup();
    if (metRunning) stopMetronome();
    E.met = audioCtx.createGain(); E.rhy = audioCtx.createGain(); E.met.connect(A.out); E.rhy.connect(A.out);
    applyVolumes();
    Object.assign(E, { running: true, gen: plan, vis: [], nextBar: audioCtx.currentTime + 0.15, startT: audioCtx.currentTime + 0.15, ending: false, endT: 0, barNo: 0, assess: [], info: info || {}, passes: 0, chordN: 0 });
    E.timer = setInterval(pump, 25);
    pump();
    loopVis();
    hideRate();
    $('#rtPlay').textContent = '■ Stop'; $('#rtPlay').classList.add('running');
    renderHead();
  }
  function pump() {
    if (!E.running) return;
    const now = audioCtx.currentTime;
    while (!E.ending && E.nextBar < now + 0.3) {
      const n = E.gen.next();
      if (n.done) { E.ending = true; E.endT = E.nextBar; break; }
      scheduleBar(n.value, E.nextBar);
    }
    if (E.ending && now > E.endT + 0.05) finish();
    scoreDue(now);
  }
  function scheduleBar(step, t0) {
    const ex = step.ex, bar = step.kind === 'count' ? { ts: ex.ts, len: RC.barLen(ex.ts), ev: [] } : ex.bars[step.bar];
    const ts = bar.ts, ts1 = tickSec(ts), len = RC.barLen(ts);
    const groups = RC.meter(ts).groups;
    E.vis.push({ t: t0, k: 'bar', step, barNo: E.barNo });
    // clicks (with the metronome's subdivision setting)
    let g0 = 0;
    groups.forEach((g, gi) => {
      click(t0 + g0 * ts1, gi === 0 ? 2 : 1, E.met);
      E.vis.push({ t: t0 + g0 * ts1, k: 'beat', n: gi + 1, step });
      if (subdiv > 1) { const div = g === 18 ? 3 : subdiv; for (let k = 1; k < div; k++) click(t0 + (g0 + (g / div) * k) * ts1, 0, E.met); }
      g0 += g;
    });
    if (step.kind !== 'count') {
      if (step.audible) RC.playTimes(bar, ex.swing).forEach((p) => strum(t0 + p.t * ts1, p.acc, ex.allDown ? 'D' : p.dir, E.rhy));
      bar.ev.forEach((e, ei) => E.vis.push({ t: t0 + RC.swungTick(e.t, ex.swing) * ts1, k: 'ev', bi: step.bar, ei, step }));
      RC.guide(bar, {}).forEach((s) => E.vis.push({ t: t0 + RC.swungTick(s.t, ex.swing) * ts1, k: 'slot', bi: step.bar, st: s.t, step }));
      if (step.assess && MIC.ready && MIC.cal) {
        const exp = RC.attacks({ bars: [bar] }).map((a) => ({ time: t0 + RC.swungTick(a.t, ex.swing) * ts1, sub: a.sub, ei: a.ei }));
        const iois = exp.map((x, i) => (i ? x.time - exp[i - 1].time : 9)).filter((x) => x > 0);
        const win = Math.max(0.045, Math.min(0.12, 0.45 * Math.min(0.5, ...iois)));
        E.assess.push({ t0, t1: t0 + len * ts1, exp, win, step, bi: step.bar, done: false });
        MIC.setRefractory(Math.max(0.035, Math.min(0.07, 0.6 * Math.min(0.5, ...iois))));
      }
      if (step.chordTick) E.chordN++;
    }
    E.nextBar = t0 + len * ts1;
    E.barNo++;
  }
  function loopVis() {
    cancelAnimationFrame(E.raf);
    const fr = () => {
      if (!E.running) return;
      const now = audioCtx.currentTime - (audioCtx.outputLatency || 0);
      E.vis.sort((a, b) => a.t - b.t || (a.k === 'bar' ? -1 : b.k === 'bar' ? 1 : 0));
      while (E.vis.length && E.vis[0].t <= now) applyVis(E.vis.shift());
      E.raf = requestAnimationFrame(fr);
    };
    E.vis.sort((a, b) => a.t - b.t);
    E.raf = requestAnimationFrame(fr);
  }
  function applyVis(v) {
    const s = v.step;
    if (v.k === 'bar') {
      if (s.ex !== RT.shown || s.show !== RT.visible) { RT.shown = s.ex; RT.visible = s.show; RT.marks = null; renderHead(); renderScore(); }
      clearHi();
      if (s.kind === 'count') renderStatus('count', 'Count-in');
      else renderStatus(s.kind, s.label);
      if (S().with === 'prog' && progChords.length && s.kind !== 'count') { const c = chordDisplayName(progChords[v.barNo % progChords.length]); $('#rtPill').textContent = 'Now: ' + c; }
    } else if (v.k === 'beat') {
      if (s.kind === 'count') { const b = $('#rtStatus .big'); if (b) b.textContent = v.n; }
    } else if (v.k === 'ev') {
      if (!RT.visible || !RT.noteEl) return;
      $$('#rtScore .rt-on').forEach((x) => x.classList.remove('rt-on'));
      const el = RT.noteEl(v.bi, v.ei); if (el) el.classList.add('rt-on');
    } else if (v.k === 'slot') {
      if (!RT.visible || !RT.slotEls || !RT.slotEls[v.bi]) return;
      $$('#rtScore .rt-slot.on').forEach((x) => x.classList.remove('on'));
      const f = RT.slotEls[v.bi].find((x) => x.t === v.st); if (f) f.el.classList.add('on');
    }
  }
  function renderStatus(kind, label) {
    const el = $('#rtStatus'), pill = $('#rtPill');
    el.className = 'rt-status';
    if (!kind) { el.innerHTML = E.running ? '' : '<span style="color:#94a3b8;font-weight:500">Press play: one bar count-in, then go</span>'; pill.className = 'rt-pill'; pill.textContent = E.running ? 'Playing' : 'Ready'; return; }
    if (kind === 'count') { el.innerHTML = `Count-in <span class="big">1</span>`; pill.className = 'rt-pill'; pill.textContent = 'Get ready'; return; }
    const cls = { play: 'answer', demo: 'listen', call: 'listen', you: 'you', response: 'you', answer: 'answer', ready: '' }[kind] || '';
    el.classList.add(cls);
    el.textContent = label || '';
    pill.className = 'rt-pill ' + cls;
    pill.textContent = { play: 'Play along', demo: 'Listen', call: 'Listen', you: 'Your turn', response: 'Your turn', answer: 'Answer', ready: 'Next up' }[kind] || '';
  }
  function stop(silent) {
    if (!E.running) return;
    E.running = false;
    clearInterval(E.timer); cancelAnimationFrame(E.raf);
    const t = audioCtx.currentTime;
    [E.met, E.rhy].forEach((g) => { try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); setTimeout(() => g.disconnect(), 200); } catch (e) {} });
    E.assess = (E.assess || []).filter((a) => a.done || a.t1 <= t + 0.01); // a bar cut short by Stop isn't scored
    scoreDue(Infinity);
    const played = Math.max(0, Math.min(t, E.ending ? E.endT : t) - E.startT);
    reportSeconds(played);
    $('#rtPlay').textContent = '▶ Play'; $('#rtPlay').classList.remove('running');
    clearHi();
    renderStatus('', '');
    if (curMode() === 'memory' && !RT.visible) $('#rtHidden').classList.add('show');
    renderHead();
    if (!silent && (played > 4 || (E.ending && played > 1))) showRate();
  }
  function finish() { stop(false); }

  // ═════════ plans for each mode ═════════
  function passesFor(ex, secs) { const barS = RC.barLen(ex.ts) * tickSec(ex.ts); return Math.max(1, Math.ceil(secs / (barS * ex.bars.length))); }
  function planFor(mode, ex, o) {
    const st = S();
    o = o || {};
    const loop = o.loop != null ? o.loop : st.loop;
    const fresh = () => { const nx = RC.generate({ level: ex.level, bars: ex.bars.length, ts: ex.src === 'gen' && ex.level < 5 ? ex.ts : undefined, adapt: RC.adaptWeights(P) }); RT.ex = nx; return nx; };
    const isGenFresh = (flag) => flag && ex.src === 'gen';
    return (function* () {
      yield { kind: 'count', ex, show: true };
      let pass = 0;
      if (mode === 'learn') {
        const max = o.passes || (loop ? Infinity : 1);
        for (; pass < max; pass++) for (let b = 0; b < ex.bars.length; b++) yield { kind: 'play', ex, bar: b, audible: true, show: true, label: 'Play along', chordTick: 1 };
      } else if (mode === 'memory') {
        const demos = o.demo || st.demo;
        for (let d = 0; d < demos; d++) for (let b = 0; b < ex.bars.length; b++) yield { kind: 'demo', ex, bar: b, audible: true, show: true, label: `Listen and memorise (${d + 1}/${demos})` };
        const max = loop ? Infinity : o.you || st.you;
        for (let y = 0; y < max; y++) for (let b = 0; b < ex.bars.length; b++) yield { kind: 'you', ex, bar: b, audible: false, show: false, assess: true, label: 'Your turn: from memory', chordTick: 1 };
      } else if (mode === 'sight') {
        const max = o.passes || (loop ? Infinity : 1);
        let cur = ex;
        for (; pass < max; pass++) {
          if (pass > 0 && (isGenFresh(o.fresh != null ? o.fresh : st.sightFresh))) { cur = fresh(); yield { kind: 'ready', ex: cur, bar: 0, audible: false, show: true, label: 'New rhythm: read ahead' }; }
          for (let b = 0; b < cur.bars.length; b++) yield { kind: 'you', ex: cur, bar: b, audible: false, show: true, assess: true, label: 'Your turn: read and play', chordTick: 1 };
          for (let b = 0; b < cur.bars.length; b++) yield { kind: 'answer', ex: cur, bar: b, audible: true, show: true, label: 'The answer: how it should sound' };
        }
      } else if (mode === 'call') {
        const max = o.passes || (loop ? Infinity : 4);
        const show = o.hideCall ? false : st.crShow;
        let cur = ex;
        for (; pass < max; pass++) {
          if (pass > 0 && isGenFresh(o.fresh != null ? o.fresh : st.crFresh)) cur = fresh();
          for (let b = 0; b < cur.bars.length; b++) {
            yield { kind: 'call', ex: cur, bar: b, audible: true, show, label: 'Call: listen' };
            yield { kind: 'response', ex: cur, bar: b, audible: false, show, assess: true, label: 'Response: play it back', chordTick: 1 };
          }
        }
      }
    })();
  }
  function play() {
    if (E.running) return stop(false);
    MIC.resetRun();
    if (RT.daily) {
      const d = RT.daily.plan[RT.daily.i];
      const o = { passes: d.passes || (d.secs ? passesFor(d.ex, d.secs) : 1), loop: false, fresh: d.fresh, hideCall: d.hideCall, demo: 2, you: 2 };
      RT.ex = d.ex;
      return start(planFor(d.mode, d.ex, o), { daily: true });
    }
    start(planFor(S().mode, RT.ex), {});
  }

  // ═════════ microphone assessment ═════════
  const WORKLET = `
  class TkOnset extends AudioWorkletProcessor {
    constructor(){ super(); this.prev=0; this.hist=[-90,-90,-90]; this.floor=-70; this.last=-1; this.refr=0.05; this.rise=9; this.above=14; this.k=0; this.peak=-90;
      this.port.onmessage=(e)=>{ Object.assign(this,e.data); }; }
    process(inputs){
      const x=inputs[0]&&inputs[0][0]; if(!x) return true;
      let e=0, prev=this.prev, mi=0, mv=0;
      for(let i=0;i<x.length;i++){ const d=x[i]-prev; prev=x[i]; const dd=d*d; e+=dd; if(dd>mv){mv=dd;mi=i;} }
      this.prev=prev; e/=x.length;
      const db=10*Math.log10(e+1e-12);
      const ref=(this.hist[0]+this.hist[1]+this.hist[2])/3;
      this.hist.shift(); this.hist.push(db);
      this.floor = db<this.floor ? this.floor*0.8+db*0.2 : this.floor*0.9995+db*0.0005;
      const t=currentTime + mi/sampleRate;
      if(db-ref>this.rise && db>this.floor+this.above && t-this.last>this.refr){ this.last=t; this.port.postMessage({o:t,db}); }
      if(db>this.peak) this.peak=db;
      if(++this.k%8===0){ this.port.postMessage({lvl:this.peak, floor:this.floor}); this.peak=-90; }
      return true;
    }
  }
  registerProcessor('tk-onset', TkOnset);`;
  const SENS = { low: { rise: 12, above: 18 }, med: { rise: 9, above: 14 }, high: { rise: 6.5, above: 10 } };
  const MIC = {
    ready: false, cal: calGet(), onsets: [], node: null, stream: null, listeners: [],
    async enable() {
      audioSetup();
      if (MIC.ready) return true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !audioCtx.audioWorklet) throw new Error('This browser can’t analyse the microphone in real time.');
      MIC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await audioCtx.audioWorklet.addModule(url);
      const src = audioCtx.createMediaStreamSource(MIC.stream);
      const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 140;
      MIC.node = new AudioWorkletNode(audioCtx, 'tk-onset');
      const sink = audioCtx.createGain(); sink.gain.value = 0;
      src.connect(hp); hp.connect(MIC.node); MIC.node.connect(sink); sink.connect(audioCtx.destination);
      MIC.node.port.onmessage = (e) => {
        const m = e.data;
        if (m.lvl != null) { const el = $('#rtLvl'); if (el) el.style.width = Math.max(0, Math.min(100, (m.lvl + 80) * 1.4)) + '%'; return; }
        MIC.onsets.push(m); if (MIC.onsets.length > 400) MIC.onsets.splice(0, 200);
        MIC.listeners.forEach((f) => f(m));
        const fl = $('#rtLvl'); if (fl) { fl.style.background = '#C17817'; setTimeout(() => (fl.style.background = ''), 90); }
      };
      MIC.setSens(S().sens);
      MIC.ready = true;
      return true;
    },
    disable() { try { MIC.stream && MIC.stream.getTracks().forEach((t) => t.stop()); MIC.node && MIC.node.disconnect(); } catch (e) {} MIC.ready = false; MIC.node = null; },
    setSens(k) { if (MIC.node) MIC.node.port.postMessage(SENS[k] || SENS.med); },
    setRefractory(s) { if (MIC.node) MIC.node.port.postMessage({ refr: s }); },
    resetRun() { MIC.onsets = []; },
  };
  function scoreDue(now) {
    if (!E.assess) return;
    E.assess.forEach((a) => {
      if (a.done || now < a.t1 + 0.15) return;
      a.done = true;
      const lat = MIC.cal.lat / 1000;
      const gate = MIC.cal.clickDb;
      const beats = []; // click times to ignore speaker bleed
      let g0 = 0; RC.meter(a.step.ex.ts).groups.forEach((g) => { beats.push(a.t0 + g0 * tickSec(a.step.ex.ts)); g0 += g; });
      const det = MIC.onsets.map((o) => ({ t: o.o - lat, db: o.db }))
        .filter((o) => o.t >= a.t0 - a.win && o.t < a.t1 - a.win * 0.5)
        .filter((o) => !(gate != null && beats.some((b) => Math.abs(o.t - b) < 0.03) && o.db < gate + 6))
        .map((o) => o.t);
      a.det = det;
      a.res = RC.score(a.exp, det, a.win);
      // per-note marks for the notation
      const marks = a.exp.map((x) => { const d = det.reduce((best, t) => (Math.abs(t - x.time) < Math.abs(best - x.time) ? t : best), Infinity); const err = Math.abs(d - x.time); return { bi: a.bi, ei: x.ei, k: err <= 0.03 ? 'ok' : err <= a.win ? 'off' : 'miss' }; });
      RT.marks = (RT.marks || []).filter((m) => m.bi !== a.bi).concat(marks);
      if (RT.visible) applyMarks(RT.marks);
      const r = a.res;
      const st = $('#rtStatus');
      if (st && E.running) st.dataset.last = `${r.hit}/${r.n} · ${r.tendency === 'centred' ? 'on time' : r.tendency} ${Math.abs(Math.round(r.mean))}ms`;
      const pill = $('#rtPill'); if (pill && E.running) pill.textContent = `${Math.round(r.acc * 100)}% last bar`;
    });
  }
  function applyMarks(marks) { marks.forEach((m) => { const el = RT.noteEl && RT.noteEl(m.bi, m.ei); if (el) { el.classList.remove('rt-hitok', 'rt-hitoff', 'rt-miss'); el.classList.add('rt-' + (m.k === 'ok' ? 'hitok' : m.k === 'off' ? 'hitoff' : 'miss')); } }); }
  function runMicResult() {
    const done = (E.assess || []).filter((a) => a.res);
    if (!done.length) return null;
    const exp = done.flatMap((a) => a.exp), det = done.flatMap((a) => a.det);
    const win = Math.min(...done.map((a) => a.win));
    return RC.score(exp, det, win);
  }
  async function calibrate(kind) {
    const out = $('#rtCalOut');
    try { await MIC.enable(); } catch (e) { out.textContent = 'Microphone unavailable: ' + e.message; return; }
    if (E.running) stop(true);
    audioSetup();
    const dest = A.out, t0 = audioCtx.currentTime + 0.6;
    const n = kind === 'loop' ? 10 : 16, gap = kind === 'loop' ? 0.55 : 0.75;
    const clicks = [];
    for (let i = 0; i < n; i++) { const t = t0 + i * gap; clicks.push(t); const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 1600; g.gain.setValueAtTime(kind === 'loop' ? 0.9 : 0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.05); }
    const got = [];
    const h = (m) => got.push(m);
    MIC.listeners.push(h);
    out.textContent = kind === 'loop' ? 'Listening to the speaker… keep quiet for 6 seconds.' : 'Strum a muted chord on every click (after the first four)…';
    await new Promise((r) => setTimeout(r, (0.6 + n * gap + 0.6) * 1000));
    MIC.listeners = MIC.listeners.filter((f) => f !== h);
    const use = kind === 'loop' ? clicks : clicks.slice(4);
    const lats = [], dbs = [];
    use.forEach((c) => { const m = got.filter((g) => g.o > c - (kind === 'loop' ? 0 : 0.2) && g.o < c + 0.4).sort((a, b) => (kind === 'loop' ? a.o - b.o : Math.abs(a.o - c - 0.08) - Math.abs(b.o - c - 0.08)))[0]; if (m) { lats.push(m.o - c); dbs.push(m.db); } });
    const med = (l) => { const s = [...l].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
    if (lats.length < use.length * 0.6) { out.textContent = kind === 'loop' ? `Only heard ${lats.length}/${use.length} clicks. Turn the volume up, take headphones off, or use “Strum along” instead.` : `Only heard ${lats.length}/${use.length} strums. Get closer to the phone or raise sensitivity.`; return; }
    const m = med(lats), spread = med(lats.map((x) => Math.abs(x - m)));
    if (spread > (kind === 'loop' ? 0.008 : 0.025)) { out.textContent = `Readings were too inconsistent (±${Math.round(spread * 1000)} ms). Try again somewhere quieter.`; return; }
    MIC.cal = { lat: Math.round(m * 1000), kind, clickDb: kind === 'loop' ? med(dbs) : null, date: todayStr() };
    calSet(MIC.cal);
    renderMic();
  }

  // ═════════ rating & results ═════════
  function showRate() {
    const mic = runMicResult();
    const ex = RT.ex, d = RT.daily && RT.daily.plan[RT.daily.i];
    const rec = { date: todayStr(), at: Date.now(), mode: curMode(), src: ex.src, ex: ex.id, lib: ex.lib || null, level: ex.level, bpm: getBpm(), meter: ex.ts, cats: ex.cats, self: null, mic: mic && mic.n ? { acc: +mic.acc.toFixed(3), mean: Math.round(mic.mean), sd: Math.round(mic.sd), hit: mic.hit, missed: mic.missed, extra: mic.extra, n: mic.n, bySub: mic.bySub } : null };
    RT.pending = rec;
    if (rec.mic) { RC.record(P, rec); rec.recorded = true; save(); }
    const el = $('#rtRate');
    el.innerHTML = `${rec.mic ? `<h4>Mic assessment</h4><div class="rt-mic-res">
        <div class="rt-stat"><div class="v">${Math.round(rec.mic.acc * 100)}%</div><div class="l">Accuracy</div></div>
        <div class="rt-stat"><div class="v">${rec.mic.hit}/${rec.mic.n}</div><div class="l">Hits</div></div>
        <div class="rt-stat"><div class="v">${rec.mic.extra}</div><div class="l">Extra</div></div>
        <div class="rt-stat"><div class="v">${rec.mic.missed}</div><div class="l">Missed</div></div>
        <div class="rt-stat"><div class="v">${Math.abs(rec.mic.mean)}<small style="font-size:11px">ms</small></div><div class="l">${mic.tendency === 'centred' ? 'Centred' : mic.tendency === 'rushing' ? 'Rushing' : 'Dragging'}</div></div>
        <div class="rt-stat"><div class="v">±${rec.mic.sd}<small style="font-size:11px">ms</small></div><div class="l">Consistency</div></div></div>` : ''}
      <h4>${rec.mic ? 'And how did it feel?' : 'How did that go?'}</h4>
      <div class="opts"><button class="rt-btn green" data-rate="nailed">Nailed it</button><button class="rt-btn" data-rate="close">Close</button><button class="rt-btn" data-rate="struggled">Struggled</button></div>
      ${d ? '' : `<button class="rt-btn small" data-rate="skip" style="margin-top:8px;width:100%;background:#fff">Skip</button>`}`;
    el.classList.add('show');
    if (curMode() === 'memory' && !RT.visible) { /* keep hidden until they reveal */ }
  }
  function hideRate() { const el = $('#rtRate'); if (el) el.classList.remove('show'); }
  function rate(k) {
    const rec = RT.pending;
    hideRate();
    if (!rec) return;
    RT.pending = null;
    if (k !== 'skip') {
      rec.self = RC.SELF[k];
      if (!rec.recorded) RC.record(P, rec);
      else { const s = rec.self; if (s != null) P.results[P.results.length - 1].self = s; }
      const wasReady = RC.levelReady(P);
      if (wasReady && P.level < 5) { P.level++; P.comfort[P.level] = P.comfort[P.level] || RC.LEVELS[P.level - 1].bpm; toast(`Level up: you’re on Level ${P.level}, ${RC.LEVELS[P.level - 1].name}`); }
      save();
    }
    if (RT.daily) nextDaily();
    renderExercise();
  }

  // ═════════ daily challenge ═════════
  function renderDaily() {
    const el = $('#rtDaily');
    const d = todayStr(), done = P.daily && P.daily[d] && P.daily[d].done, streak = RC.dailyStreak(P, d);
    if (RT.daily) {
      const i = RT.daily.i, cur = RT.daily.plan[i];
      el.innerHTML = `<div class="t">Daily rhythm challenge · Level ${P.level}</div><div class="h">${esc(cur.title)}</div><div class="s">${esc(cur.blurb || '')}</div>
        <div class="rt-steps">${RT.daily.plan.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
        <div class="row"><span class="s">Step ${i + 1} of 5 · press Play</span><span><button class="rt-btn small ghost" data-daily="skip">Skip</button> <button class="rt-btn small ghost" data-daily="end">End</button></span></div>`;
      return;
    }
    el.innerHTML = `<div class="t">Daily rhythm challenge${streak ? ` · 🔥 ${streak}-day streak` : ''}</div>
      <div class="h">${done ? '✓ Done today' : 'Five steps · about 7 minutes'}</div>
      <div class="s">Warm-up, subdivisions, sight-reading, call &amp; response, then a genre groove, at Level ${P.level} and your comfortable tempo.</div>
      <div class="row"><span class="s">Level ${P.level} · ${RC.LEVELS[P.level - 1].name}</span><button class="rt-btn small" data-daily="start">${done ? 'Again' : 'Start'}</button></div>`;
  }
  function startDaily() {
    if (E.running) stop(true);
    RT.daily = { plan: RC.dailyPlan(P, todayStr() + (P.daily && P.daily[todayStr()] && P.daily[todayStr()].done ? '-' + Date.now() : '')), i: 0 };
    loadDailyStep();
  }
  function loadDailyStep() { const d = RT.daily.plan[RT.daily.i]; setBpm(d.bpm); setExercise(d.ex, { keepBpm: true }); renderDaily(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function nextDaily() {
    if (RT.daily.i < 4) { RT.daily.i++; loadDailyStep(); return; }
    const d = todayStr();
    P.daily = P.daily || {}; P.daily[d] = { done: true, level: P.level };
    const s = RC.dailyStreak(P, d); P.pb.streak = Math.max(P.pb.streak || 0, s);
    save();
    RT.daily = null;
    toast(`Daily challenge complete${s > 1 ? ` · ${s}-day streak` : ''} 🎉`);
    renderDaily(); setExercise(newExercise());
  }
  function endDaily() { if (E.running) stop(true); RT.daily = null; renderDaily(); setExercise(newExercise()); }

  // ═════════ settings panels ═════════
  function renderExercise() {
    const st = S(), body = $('#rtExBody');
    const lvl = RC.LEVELS.map((l) => `<button class="rt-level ${P.level === l.n ? 'active' : ''}" data-level="${l.n}"><b>${l.n}</b><span>${esc(l.name)}</span></button>`).join('');
    const master = RC.mastered(P);
    let modeOpts = '';
    if (st.mode === 'memory') modeOpts = `<div class="rt-lab">Demo plays</div><div class="rt-chips">${[1, 2, 3].map((n) => `<button class="rt-chip ${st.demo === n ? 'active' : ''}" data-set="demo" data-v="${n}">${n}×</button>`).join('')}</div><div class="rt-lab">Your turn${st.loop ? ' (loop on: repeats until you stop)' : ''}</div><div class="rt-chips">${[1, 2, 4].map((n) => `<button class="rt-chip ${st.you === n ? 'active' : ''}" data-set="you" data-v="${n}">${n}×</button>`).join('')}</div>`;
    if (st.mode === 'call') modeOpts = `<div class="rt-lab">Each call</div><div class="rt-chips"><button class="rt-chip ${!st.crFresh ? 'active' : ''}" data-set="crFresh" data-v="0">Same rhythm</button><button class="rt-chip ${st.crFresh ? 'active' : ''}" data-set="crFresh" data-v="1">New rhythm</button></div><div class="rt-lab">Notation</div><div class="rt-chips"><button class="rt-chip ${st.crShow ? 'active' : ''}" data-set="crShow" data-v="1">Show</button><button class="rt-chip ${!st.crShow ? 'active' : ''}" data-set="crShow" data-v="0">By ear only</button></div>`;
    if (st.mode === 'sight') modeOpts = `<div class="rt-lab">When looping</div><div class="rt-chips"><button class="rt-chip ${!st.sightFresh ? 'active' : ''}" data-set="sightFresh" data-v="0">Repeat it</button><button class="rt-chip ${st.sightFresh ? 'active' : ''}" data-set="sightFresh" data-v="1">New rhythm each time</button></div>`;
    body.innerHTML = `<div class="rt-seg" style="grid-template-columns:1fr 1fr"><button class="${st.src === 'gen' ? 'active' : ''}" data-set="src" data-v="gen">Generate</button><button class="${st.src === 'lib' ? 'active' : ''}" data-set="src" data-v="lib">Library</button></div>
      ${st.src === 'gen' ? `<div class="rt-lab">Level</div><div class="rt-levels">${lvl}</div><div class="rt-note">${esc(RC.LEVELS[P.level - 1].blurb)}. Comfortable tempo here: ${P.comfort[P.level] || RC.LEVELS[P.level - 1].bpm} BPM.${RC.levelReady(P) ? ' <b style="color:#3F9E6E">Ready for the next level.</b>' : ''}</div>
        <div class="rt-lab">Bars per exercise</div><div class="rt-chips">${[1, 2, 4].map((n) => `<button class="rt-chip ${(P.bars || 1) === n ? 'active' : ''}" data-bars="${n}">${n} bar${n > 1 ? 's' : ''}</button>`).join('')}</div>`
        : `<div class="rt-lab">Genre</div><div class="rt-chips">${RC.GENRES.map((g) => `<button class="rt-chip ${st.genre === g ? 'active' : ''}" data-genre="${esc(g)}">${esc(g)}</button>`).join('')}</div>
        <div class="rt-lib">${RC.LIB.filter((p) => p.g === st.genre).map((p) => `<button class="rt-libitem ${st.lib === p.id ? 'active' : ''}" data-lib="${p.id}"><div><div class="n">${esc(p.name)} ${master.has('l:' + p.id) ? '<span class="ok">✓</span>' : ''}</div><div class="s">Level ${p.L} · ${p.ts || '4/4'} · target ${p.bpm}${p.swing ? ' · swing' : ''}</div></div><span style="color:#94a3b8">›</span></button>`).join('')}</div>`}
      ${modeOpts}`;
  }
  function renderGuide() {
    const st = S(), g = st.g;
    const tog = (k, label) => `<button class="rt-tog ${g[k] ? 'on' : ''}" data-g="${k}"><span class="bx">${g[k] ? '✓' : ''}</span>${label}</button>`;
    $('#rtGuideBody').innerHTML = `<div class="rt-toggles">${tog('strum', '↓↑ Strum directions')}${tog('count', '1 e &amp; a Counting')}${tog('acc', '&gt; Accents')}${tog('ghost', '(↑) Ghost &amp; muted strums')}</div>
      <div class="rt-note"><b>↓ ↑</b> strike the strings · <span style="color:#E14B4A;font-weight:700">↓</span> accented · faint arrows are <b>ghost strums</b>: the hand keeps moving but misses the strings · <b>×</b> rest: keep moving with the strings muted. Straight rhythms strum down on the beat; triplets alternate continuously (down-up-down, up-down-up). Triplets are counted “1 la li”.</div>
      <div class="rt-lab">Practise with</div><div class="rt-chips">${Object.entries(WITH).map(([k, v]) => `<button class="rt-chip ${st.with === k ? 'active' : ''}" data-set="with" data-v="${k}">${v}</button>`).join('')}</div>`;
  }
  function renderSound() {
    const st = S();
    $('#rtSoundBody').innerHTML = `<div class="rt-range"><label>Metronome</label><input type="range" min="0" max="100" value="${st.metVol}" data-vol="metVol"><span class="val">${st.metVol}</span></div>
      <div class="rt-range"><label>Rhythm</label><input type="range" min="0" max="100" value="${st.rhyVol}" data-vol="rhyVol"><span class="val">${st.rhyVol}</span></div>
      <div class="rt-lab">Rhythm sound</div><div class="rt-chips"><button class="rt-chip ${st.sound === 'strum' ? 'active' : ''}" data-set="sound" data-v="strum">Muted strum</button><button class="rt-chip ${st.sound === 'block' ? 'active' : ''}" data-set="sound" data-v="block">Woodblock</button></div>
      <div class="rt-note">The click follows the metronome’s subdivision setting (♩ ♪♪ ³) in the top bar, and BPM is shared with it.</div>`;
  }
  function renderMic() {
    const st = S(), c = MIC.cal;
    $('#rtMicBody').innerHTML = `<button class="rt-tog ${st.mic ? 'on' : ''}" data-mic="toggle" style="width:100%"><span class="bx">${st.mic ? '✓' : ''}</span>Assess my playing with the microphone</button>
      ${st.mic ? `<div class="rt-meter"><i id="rtLvl"></i></div>
      <div class="rt-lab">Latency calibration ${c ? `· <span style="color:#3F9E6E;text-transform:none;letter-spacing:0">${c.lat} ms (${c.kind === 'loop' ? 'speaker test' : 'strum test'}, ${c.date})</span>` : '· <span style="color:#E14B4A;text-transform:none;letter-spacing:0">needed before scoring</span>'}</div>
      <div class="rt-grid3" style="grid-template-columns:1fr 1fr"><button class="rt-btn small" data-cal="loop">🔊 Speaker test</button><button class="rt-btn small" data-cal="strum">🎸 Strum along</button></div>
      <div class="rt-note" id="rtCalOut">Speaker test: the phone listens to its own clicks to measure delay (no headphones, volume up). Strum along: for headphones, strum muted strings in time with 12 clicks.</div>
      <div class="rt-lab">Sensitivity</div><div class="rt-chips">${['low', 'med', 'high'].map((k) => `<button class="rt-chip ${st.sens === k ? 'active' : ''}" data-set="sens" data-v="${k}">${{ low: 'Low (noisy room)', med: 'Medium', high: 'High (soft strums)' }[k]}</button>`).join('')}</div>` : ''}
      <div class="rt-note">Scoring runs only on <b>your-turn</b> bars (Memory, Sight-read, Call &amp; response), when the demo is silent, and only after calibration. It detects strum onsets, not pitch. Headphones give the cleanest result because the click can’t bleed into the mic. If the numbers ever look wrong, rely on the self-rating: nothing is estimated or simulated.</div>`;
  }
  function renderProgress() {
    const d = todayStr();
    const sec = (k) => Math.round((P.days[k] || 0) / 60);
    let w = 0; for (let i = 0; i < 7; i++) { const dt = new Date(d + 'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate() - i); w += P.days[dt.toISOString().slice(0, 10)] || 0; }
    const tot = Object.values(P.days || {}).reduce((a, b) => a + b, 0);
    const mastered = RC.mastered(P), libM = RC.LIB.filter((p) => mastered.has('l:' + p.id)).length;
    const bb = RC.bestBpm(P), weak = RC.weakest(P, 4), sub = RC.subAccuracy(P);
    const pb = P.pb || {};
    const bar = (nm, v, n, col) => `<div class="rt-bar"><span class="nm">${esc(nm)}</span><span class="tr"><i style="width:${Math.round(v * 100)}%;background:${col || (v >= 0.8 ? '#3F9E6E' : v >= 0.55 ? '#C17817' : '#E14B4A')}"></i></span><span class="pc">${Math.round(v * 100)}%</span></div>`;
    $('#rtProgBody').innerHTML = `<div class="rt-grid3"><div class="rt-stat"><div class="v">${sec(d)}</div><div class="l">Min today</div></div><div class="rt-stat"><div class="v">${Math.round(w / 60)}</div><div class="l">Min · 7 days</div></div><div class="rt-stat"><div class="v">${Math.round(tot / 3600 * 10) / 10}</div><div class="l">Hours total</div></div>
      <div class="rt-stat"><div class="v">${mastered.size}</div><div class="l">Mastered</div></div><div class="rt-stat"><div class="v">${libM}/${RC.LIB.length}</div><div class="l">Library</div></div><div class="rt-stat"><div class="v">${P.level}</div><div class="l">Level</div></div></div>
      <div class="rt-lab">Highest comfortable BPM</div><div class="rt-note" style="margin-top:0">${Object.keys(bb).length ? Object.entries(bb).map(([l, v]) => `Level ${l}: <b>${v}</b>`).join(' · ') : 'Rate an exercise “Nailed it” (or score 80%+) to set one.'}</div>
      <div class="rt-lab">Personal bests</div><div class="rt-note" style="margin-top:0">${[pb.acc ? `Best mic accuracy <b>${Math.round(pb.acc.v * 100)}%</b> at ${pb.acc.bpm} BPM` : null, pb.bpm ? `Fastest nailed <b>${pb.bpm.v} BPM</b> (Level ${pb.bpm.level})` : null, pb.streak ? `Longest daily streak <b>${pb.streak}</b>` : null].filter(Boolean).join(' · ') || 'None yet.'}</div>
      <div class="rt-lab">Weakest patterns (these appear more often)</div>${weak.length ? weak.map((x) => bar(x.cat, x.score, x.n)).join('') : '<div class="rt-note" style="margin-top:0">Rate a few exercises and your weak spots will show here.</div>'}
      <div class="rt-lab">Accuracy by subdivision (mic)</div>${sub.length ? sub.map((x) => bar(x.sub, x.acc, x.n)).join('') : '<div class="rt-note" style="margin-top:0">Turn on mic assessment to measure this.</div>'}
      <div class="rt-lab">Recent</div><div class="rt-note" style="margin-top:0">${(P.results || []).slice(-5).reverse().map((r) => `${r.date.slice(5)} · ${MODES[r.mode] ? MODES[r.mode].name : r.mode} · L${r.level} · ${r.bpm} BPM · ${r.mic ? Math.round(r.mic.acc * 100) + '% mic' : r.self === 1 ? 'nailed' : r.self === 0.6 ? 'close' : r.self === 0.2 ? 'struggled' : '—'}`).join('<br>') || 'Nothing yet.'}</div>`;
  }
  function renderAll() { renderDaily(); renderHead(); renderExercise(); renderGuide(); renderSound(); renderMic(); setBpm(getBpm()); }

  // ═════════ events ═════════
  function onClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    const st = S(), ds = b.dataset;
    if (b.id === 'rtPlay') return play();
    if (b.id === 'rtNew') { if (E.running) stop(true); return setExercise(newExercise()); }
    if (b.id === 'rtLoop') { st.loop = !st.loop; save(); renderHead(); renderScore(); renderExercise(); return; }
    if (b.id === 'rtReveal') { RT.visible = true; RT.shown = RT.ex; renderScore(); return; }
    if (b.id === 'rtListen') { if (E.running) stop(true); RT.visible = true; RT.shown = RT.ex; renderScore(); start((function* () { yield { kind: 'count', ex: RT.ex }; for (let b2 = 0; b2 < RT.ex.bars.length; b2++) yield { kind: 'demo', ex: RT.ex, bar: b2, audible: true, show: true, label: 'Listen' }; })(), {}); return; }
    if (ds.bpm) { setBpm(getBpm() + +ds.bpm); return; }
    if (ds.mode) { if (E.running) stop(true); st.mode = ds.mode; save(); RT.visible = true; RT.shown = RT.ex; hideRate(); renderHead(); renderScore(); renderExercise(); return; }
    if (ds.level) { P.level = +ds.level; save(); renderExercise(); if (E.running) stop(true); setExercise(newExercise(), { levelChange: true }); return; }
    if (ds.bars) { P.bars = +ds.bars; save(); renderExercise(); if (E.running) stop(true); setExercise(newExercise()); return; }
    if (ds.genre) { st.genre = ds.genre; save(); renderExercise(); return; }
    if (ds.lib) { st.lib = ds.lib; save(); renderExercise(); if (E.running) stop(true); setExercise(newExercise()); return; }
    if (ds.set) {
      const v = ds.v; const cur = st[ds.set];
      st[ds.set] = typeof cur === 'number' ? +v : typeof cur === 'boolean' ? v === '1' : v;
      save();
      if (ds.set === 'src') { renderExercise(); if (E.running) stop(true); setExercise(newExercise()); return; }
      if (ds.set === 'with') { renderGuide(); renderHead(); renderScore(); return; }
      if (ds.set === 'sens') { MIC.setSens(v); renderMic(); return; }
      if (ds.set === 'sound') { renderSound(); return; }
      renderExercise();
      return;
    }
    if (ds.g) { st.g[ds.g] = !st.g[ds.g]; save(); renderGuide(); renderScore(); return; }
    if (ds.rate) return rate(ds.rate);
    if (ds.daily === 'start') return startDaily();
    if (ds.daily === 'skip') { if (E.running) stop(true); hideRate(); RT.pending = null; return nextDaily(); }
    if (ds.daily === 'end') return endDaily();
    if (ds.mic === 'toggle') {
      st.mic = !st.mic; save();
      if (st.mic) MIC.enable().then(renderMic).catch((err) => { st.mic = false; save(); renderMic(); const o = $('#rtMicBody .rt-note:last-child'); if (o) o.innerHTML = '<b style="color:#E14B4A">Microphone unavailable:</b> ' + esc(err.message || err.name) + '. Check the browser’s microphone permission.'; });
      else MIC.disable();
      renderMic(); return;
    }
    if (ds.cal) return calibrate(ds.cal);
  }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.vol) { S()[t.dataset.vol] = +t.value; t.nextElementSibling.textContent = t.value; applyVolumes(); save(); }
  }
  function toast(m) { const t = document.createElement('div'); t.className = 'rt-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }

  // ═════════ lifecycle ═════════
  function loadVex(cb) {
    if (window.Vex) return cb();
    const s = document.createElement('script'); s.src = 'vendor/vexflow-bravura.js'; s.onload = cb;
    s.onerror = () => { $('#rtScore').innerHTML = '<div class="rt-loading">Couldn’t load the notation engine. Check your connection once, then it works offline.</div>'; };
    document.head.appendChild(s);
  }
  window.RhythmTrainer = {
    show() {
      RT.open = true;
      if (RT.loaded) { renderHead(); renderScore(); return; }
      RT.loaded = true;
      mount();
      load(() => {
        wrapGlobals();
        if (S().mic) S().mic = false; // the mic is switched on per visit, never silently
        RT.ex = newExercise(); RT.shown = RT.ex;
        if (RT.ex.src === 'gen') setBpm(P.comfort[P.level] || 70); else setBpm(Math.round(RT.ex.bpm * 0.85 / 2) * 2);
        renderAll();
        renderStatus('', '');
        loadVex(() => renderScore());
      });
    },
    hide() { RT.open = false; if (E.running) stop(true); },
    _debug: () => ({ P, RT, E, MIC }),
  };
})();
