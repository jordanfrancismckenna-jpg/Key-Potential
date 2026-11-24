/* Rhythm Trainer — pure engine (no DOM, no audio).
 * Time unit: ticks, crotchet = 12 (so semiquaver = 3, quaver-triplet = 4, sextuplet = 2).
 * A bar is a list of events {t, d, rest, tieNext, tied, acc, tup, base, dots}.
 * Everything here is deterministic given a random source, so it can be fuzz-tested in Node. */
(function (root) {
  'use strict';
  const Q = 12;
  const BASE = { w: 48, h: 24, q: 12, e: 6, s: 3 };
  const VF = { w: 'w', h: 'h', q: 'q', e: '8', s: '16' };

  // ── Time signatures: beat groups in ticks (what the click marks and what beams group by) ──
  const METERS = {
    '4/4': { num: 4, den: 4, groups: [12, 12, 12, 12] },
    '3/4': { num: 3, den: 4, groups: [12, 12, 12] },
    '2/4': { num: 2, den: 4, groups: [12, 12] },
    '5/4': { num: 5, den: 4, groups: [12, 12, 12, 12, 12] },
    '6/8': { num: 6, den: 8, groups: [18, 18] },
    '7/8': { num: 7, den: 8, groups: [12, 12, 18] },
    '12/8': { num: 12, den: 8, groups: [18, 18, 18, 18] },
  };
  const meter = (ts) => METERS[ts] || METERS['4/4'];
  const barLen = (ts) => meter(ts).groups.reduce((a, b) => a + b, 0);

  // ── Mini notation language ──
  //  q e s h w = crotchet quaver semiquaver minim semibreve;  "." dotted;  r prefix = rest;
  //  ">" accent;  "~" tie into next note;  3[ … ] triplet;  6[ … ] sextuplet;  "|" barline.
  let tupSeq = 0;
  function parseBar(src) {
    const ev = [];
    let t = 0;
    const toks = src.trim().split(/\s+/).filter(Boolean);
    let tup = null;
    for (let raw of toks) {
      let m = raw.match(/^(3|6)\[(.*)$/);
      if (m) { tup = { id: ++tupSeq, n: +m[1], occ: m[1] === '3' ? 2 : 4 }; raw = m[2]; if (!raw) continue; }
      let close = false;
      if (raw.endsWith(']')) { close = true; raw = raw.slice(0, -1); }
      if (raw) {
        const mm = raw.match(/^(r?)([whqes])(\.?)([>~]*)$/);
        if (!mm) throw new Error('Bad token ' + raw + ' in "' + src + '"');
        let d = BASE[mm[2]] * (mm[3] ? 1.5 : 1);
        if (tup) d = d * 2 / 3;
        if (Math.abs(d - Math.round(d)) > 1e-9) throw new Error('Non-integer duration in ' + src);
        d = Math.round(d);
        ev.push({ t, d, rest: mm[1] === 'r', acc: mm[4].includes('>'), tieNext: mm[4].includes('~'), tied: false, base: mm[2], dots: mm[3] ? 1 : 0, tup: tup ? { id: tup.id, n: tup.n, occ: tup.occ } : null });
        t += d;
      }
      if (close) tup = null;
    }
    return ev;
  }
  function markTies(bars) {
    // tieNext on an event makes the following event (possibly next bar) a held continuation
    const flat = [];
    bars.forEach((b) => b.ev.forEach((e) => flat.push(e)));
    flat.forEach((e) => (e.tied = false));
    for (let i = 0; i < flat.length; i++) if (flat[i].tieNext && flat[i + 1] && !flat[i + 1].rest && !flat[i].rest) flat[i + 1].tied = true; else flat[i].tieNext = flat[i].tieNext && !!flat[i + 1] && !flat[i + 1].rest && !flat[i].rest;
    return bars;
  }
  function parse(src, ts) {
    ts = ts || '4/4';
    const bars = src.split('|').map((s) => ({ ts, len: barLen(ts), ev: parseBar(s) }));
    return markTies(bars);
  }
  function toDSL(bar) {
    let out = [], open = null;
    bar.ev.forEach((e, i) => {
      let tok = (e.rest ? 'r' : '') + e.base + (e.dots ? '.' : '') + (e.acc ? '>' : '') + (e.tieNext ? '~' : '');
      if (e.tup && (!open || open !== e.tup.id)) { tok = e.tup.n + '[' + tok; open = e.tup.id; }
      const nx = bar.ev[i + 1];
      if (e.tup && (!nx || !nx.tup || nx.tup.id !== e.tup.id)) { tok += ']'; open = null; }
      out.push(tok);
    });
    return out.join(' ');
  }

  // ── Validation: maths and notation rules ──
  function validateBar(bar) {
    const errs = [];
    const len = barLen(bar.ts);
    let t = 0;
    bar.ev.forEach((e) => { if (e.t !== t) errs.push('gap/overlap at ' + t); if (!(e.d > 0) || e.d !== Math.round(e.d)) errs.push('bad duration'); t += e.d; });
    if (t !== len) errs.push(`sum ${t} ≠ bar ${len}`);
    // tuplets: complete, inside one beat group (or a crotchet-triplet spanning two simple beats from a strong beat)
    const tups = {};
    bar.ev.forEach((e) => { if (e.tup) (tups[e.tup.id] = tups[e.tup.id] || []).push(e); });
    const groups = meter(bar.ts).groups, starts = [];
    groups.reduce((a, g) => (starts.push(a), a + g), 0);
    Object.values(tups).forEach((list) => {
      const span = list.reduce((a, e) => a + e.d, 0), s = list[0].t;
      if (span !== 12 && span !== 24 && span !== 6) errs.push('tuplet span ' + span);
      if (span === 24 && !(s % 24 === 0)) errs.push('crotchet triplet off strong beat');
      if (span === 12 && s % 12 !== 0) errs.push('triplet not on beat');
      if (span === 6 && s % 6 !== 0) errs.push('semiquaver triplet off quaver');
    });
    // representable durations
    bar.ev.forEach((e) => { if (!e.tup && ![48, 36, 24, 18, 12, 9, 6, 3].includes(e.d)) errs.push('unrepresentable ' + e.d); });
    // a note may not cross the middle of a 4/4 bar unless it starts on beat 1 (minim/dotted minim) — standard engraving rule
    if (bar.ts === '4/4') bar.ev.forEach((e) => { if (e.t < 24 && e.t + e.d > 24 && e.t % 24 !== 0 && !e.tup) errs.push('obscures beat 3 at ' + e.t); });
    return errs;
  }
  function validate(ex) {
    const errs = [];
    ex.bars.forEach((b, i) => validateBar(b).forEach((x) => errs.push(`bar ${i + 1}: ${x}`)));
    const flat = ex.bars.flatMap((b) => b.ev);
    flat.forEach((e, i) => { if (e.tieNext && (!flat[i + 1] || flat[i + 1].rest)) errs.push('tie to nothing'); if (e.tied && e.rest) errs.push('tied rest'); });
    if (flat.length && flat[0].tied) errs.push('starts tied');
    if (!attacks(ex).length) errs.push('no attacks');
    return errs;
  }

  // ── Cells for the generator ──
  // cat = what the cell trains (used for adaptive weighting and "weakest patterns")
  const SIMPLE = [
    // level 1 — fundamentals
    { s: 'q', L: 1, w: 3, cat: 'crotchets' },
    { s: 'e e', L: 1, w: 3, cat: 'quavers' },
    { s: 'rq', L: 1, w: 1, cat: 'rests' },
    { s: 'e re', L: 1, w: 1, cat: 'rests' },
    { s: 're e', L: 1, w: 1.2, cat: 'offbeats' },
    // level 2 — subdivisions
    { s: 's s s s', L: 2, w: 2, cat: 'semiquavers' },
    { s: 'e s s', L: 2, w: 2, cat: 'semiquavers' },
    { s: 's s e', L: 2, w: 2, cat: 'semiquavers' },
    { s: '3[e e e]', L: 2, w: 2, cat: 'triplets' },
    // level 3 — syncopation & dotted
    { s: 's e s', L: 3, w: 2, cat: 'syncopation' },
    { s: 'e. s', L: 3, w: 2, cat: 'dotted' },
    { s: 's e.', L: 3, w: 1.2, cat: 'dotted' },
    { s: '3[q e]', L: 3, w: 1.5, cat: 'triplets' },
    { s: '3[e re e]', L: 3, w: 1, cat: 'triplets' },
    { s: 're s s', L: 3, w: 1.2, cat: 'syncopation' },
    // level 4 — fluency: rests inside subdivisions
    { s: 'rs s s s', L: 4, w: 1.4, cat: 'semiquaver rests' },
    { s: 's s re', L: 4, w: 1, cat: 'semiquaver rests' },
    { s: 'rs s e', L: 4, w: 1.2, cat: 'semiquaver rests' },
    { s: 'rs e s', L: 4, w: 1.2, cat: 'syncopation' },
    { s: '3[re e e]', L: 4, w: 1.2, cat: 'triplets' },
    { s: '3[e e re]', L: 4, w: 1, cat: 'triplets' },
    // level 5 — advanced
    { s: '6[s s s s s s]', L: 5, w: 1.2, cat: 'sextuplets' },
    { s: '3[s s s] e', L: 5, w: 1, cat: 'sextuplets' },
    { s: 'e 3[s s s]', L: 5, w: 1, cat: 'sextuplets' },
    { s: 'rs s rs s', L: 5, w: 1, cat: 'syncopation' },
  ];
  const DOUBLE = [ // two simple beats, only from a strong beat (1 or 3 in 4/4)
    { s: 'h', L: 1, w: 1, cat: 'crotchets' },
    { s: 'q. e', L: 3, w: 1.6, cat: 'dotted' },
    { s: 'e q e', L: 3, w: 1.6, cat: 'syncopation' },
    { s: 'e e~ e e', L: 4, w: 1.4, cat: 'ties' },
    { s: '3[q q q]', L: 4, w: 1.2, cat: 'crotchet triplets' },
    { s: 's e s~ s e s', L: 5, w: 1, cat: 'ties' },
    { s: '3[q rq q]', L: 5, w: 0.8, cat: 'crotchet triplets' },
  ];
  const COMPOUND = [ // dotted-crotchet beat (6/8, 12/8, the 3 of 7/8)
    { s: 'q.', L: 1, w: 1.5, cat: 'compound' },
    { s: 'e e e', L: 1, w: 3, cat: 'compound' },
    { s: 'q e', L: 1, w: 2, cat: 'compound' },
    { s: 'e q', L: 3, w: 1.2, cat: 'syncopation' },
    { s: 're e e', L: 2, w: 1, cat: 'rests' },
    { s: 'e. s e', L: 3, w: 1.2, cat: 'dotted' },
    { s: 's s e e', L: 2, w: 1.2, cat: 'semiquavers' },
    { s: 's s s s s s', L: 4, w: 1, cat: 'semiquavers' },
    { s: 'e s s e', L: 3, w: 1, cat: 'semiquavers' },
  ];
  const ODD_QUAVER_PAIR = [ // 2-quaver group in 7/8 (no tuplets)
    { s: 'q', L: 1, w: 2, cat: 'odd metre' },
    { s: 'e e', L: 1, w: 3, cat: 'odd metre' },
    { s: 're e', L: 2, w: 1, cat: 'offbeats' },
    { s: 's s e', L: 2, w: 1, cat: 'semiquavers' },
    { s: 'e s s', L: 2, w: 1, cat: 'semiquavers' },
    { s: 'e. s', L: 3, w: 1, cat: 'dotted' },
  ];
  const CATS = ['crotchets', 'quavers', 'rests', 'offbeats', 'semiquavers', 'triplets', 'syncopation', 'dotted', 'semiquaver rests', 'ties', 'crotchet triplets', 'sextuplets', 'compound', 'odd metre', 'accents'];

  const LEVELS = [
    { n: 1, name: 'Fundamentals', blurb: 'Crotchets, quavers and simple rests', bpm: 70 },
    { n: 2, name: 'Subdivisions', blurb: 'Semiquavers, triplets, mixed lengths', bpm: 66 },
    { n: 3, name: 'Syncopation', blurb: 'Offbeats, accents and dotted notes', bpm: 66 },
    { n: 4, name: 'Rhythmic fluency', blurb: 'Ties, rests inside beats, multi-bar', bpm: 64 },
    { n: 5, name: 'Advanced', blurb: 'Changing subdivisions, odd metres', bpm: 60 },
  ];

  // ── Random helpers ──
  function rng(seed) { // mulberry32 — seedable so the daily challenge is the same all day
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function pickW(list, wf, R) {
    const ws = list.map(wf), tot = ws.reduce((a, b) => a + b, 0);
    let x = R() * tot;
    for (let i = 0; i < list.length; i++) { x -= ws[i]; if (x <= 0) return list[i]; }
    return list[list.length - 1];
  }
  const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // weight of a cell at a level: new material for the level is emphasised, older material stays in the mix
  function cellWeight(c, L, adapt) {
    if (c.L > L) return 0;
    let w = c.w * (c.L === L ? 2.4 : c.L === L - 1 ? 1.3 : 0.7);
    if (adapt && adapt[c.cat] != null) w *= adapt[c.cat];
    return w;
  }

  // ── Generator ──
  function generate(opts) {
    const L = Math.max(1, Math.min(5, opts.level || 1));
    const nBars = opts.bars || 1;
    const R = opts.rand || Math.random;
    const adapt = opts.adapt || null;
    let ts = opts.ts;
    if (!ts) ts = L < 5 ? '4/4' : pickW(['4/4', '3/4', '5/4', '6/8', '7/8', '12/8'], (x) => ({ '4/4': 3, '3/4': 1.2, '5/4': 1, '6/8': 1.3, '7/8': 1, '12/8': 0.8 })[x], R);
    for (let attempt = 0; attempt < 200; attempt++) {
      const srcBars = [], cats = new Set();
      for (let b = 0; b < nBars; b++) srcBars.push(genBarSrc(ts, L, R, adapt, cats));
      const ex = { ts, level: L, src: 'gen', bars: srcBars.map((s) => ({ ts, len: barLen(ts), ev: parseBar(s) })) };
      if (L >= 4) addTies(ex, R, L);
      if (L >= 3) addAccents(ex, R, L, cats);
      markTies(ex.bars);
      if (ex.bars.some((b) => b.ev.some((e) => e.tied))) cats.add('ties');
      ex.cats = [...cats];
      ex.dsl = ex.bars.map(toDSL).join(' | ');
      ex.id = 'g:' + ts + ':' + ex.dsl;
      if (!validate(ex).length && goodVariety(ex, L)) return ex;
    }
    return parse('q q q q', '4/4') && { ts: '4/4', level: 1, src: 'gen', bars: parse('q q q q'), cats: ['crotchets'], dsl: 'q q q q', id: 'g:fallback' };
  }
  function genBarSrc(ts, L, R, adapt, cats) {
    const groups = meter(ts).groups, out = [];
    const simple = groups.every((g) => g === 12);
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      let pool;
      if (g === 18) pool = COMPOUND;
      else if (ts === '7/8') pool = ODD_QUAVER_PAIR;
      else pool = SIMPLE;
      // two-beat cells from a strong beat in simple metres
      const strong = simple && gi % 2 === 0 && gi + 1 < groups.length && (ts !== '3/4' || gi === 0);
      let cands = pool.map((c) => ({ c, span: 1 }));
      if (strong) cands = cands.concat(DOUBLE.map((c) => ({ c, span: 2 })));
      const pick = pickW(cands, (x) => cellWeight(x.c, L, adapt) * (x.span === 2 ? 0.55 : 1), R);
      out.push(pick.c.s);
      cats.add(pick.c.cat);
      if (ts !== '4/4' && ts !== '2/4') cats.add(g === 18 ? 'compound' : 'odd metre');
      gi += pick.span - 1;
    }
    return out.join(' ');
  }
  function addTies(ex, R, L) {
    // tie the last note of a beat into the first note of the next (syncopation across the beat), occasionally across the barline
    const p = L >= 5 ? 0.3 : 0.22;
    ex.bars.forEach((bar, bi) => {
      const groups = meter(bar.ts).groups;
      let acc = 0;
      groups.forEach((g, gi) => {
        acc += g;
        const lastInGroup = [...bar.ev].reverse().find((e) => e.t < acc);
        const first = bar.ev.find((e) => e.t === acc) || (gi === groups.length - 1 && ex.bars[bi + 1] ? ex.bars[bi + 1].ev[0] : null);
        if (!lastInGroup || !first || lastInGroup.t + lastInGroup.d !== acc) return;
        if (lastInGroup.rest || first.rest || lastInGroup.tied || lastInGroup.t === acc - g) return; // never tie a whole-beat note (looks like a longer note written badly)
        if (R() < p) lastInGroup.tieNext = true;
      });
    });
  }
  function addAccents(ex, R, L, cats) {
    ex.bars.forEach((bar) => {
      const hits = bar.ev.filter((e) => !e.rest);
      if (!hits.length) return;
      const n = L >= 4 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        // prefer offbeats: accents that fight the pulse are the ones worth practising
        const e = pickW(hits, (x) => (x.t % 12 === 0 ? 0.6 : 1.6), R);
        if (!e.tied) { e.acc = true; cats.add('accents'); }
      }
    });
  }
  function goodVariety(ex, L) {
    return ex.bars.every((b) => {
      const hits = b.ev.filter((e) => !e.rest && !e.tied).length;
      const restTicks = b.ev.filter((e) => e.rest).reduce((a, e) => a + e.d, 0);
      return hits >= 2 && restTicks <= b.len / 2 && !(L === 1 && hits > 8);
    });
  }

  // ── Library: generic genre patterns ──
  const LIB = [
    { id: 'rock-drive', g: 'Rock', name: 'Eighth-note drive', s: 'e e e> e e e e> e', L: 1, bpm: 110, allDown: true, tip: 'All downstrokes, palm-muted. Keep the backbeat accents on 2 and 4 heavier.' },
    { id: 'rock-push', g: 'Rock', name: 'Push into beat 3', s: 'q e e~ e e q', L: 3, bpm: 96, tip: 'The & of 2 is anticipated and held through beat 3. Keep your hand moving through the tie.' },
    { id: 'rock-riff2', g: 'Rock', name: 'Two-bar stop riff', s: 'q e e~ e e q | e e q> rq q>', L: 3, bpm: 92, tip: 'Bar 2 stops dead on beat 3. Choke the strings with your fretting hand on the rest.' },
    { id: 'indie-gallop', g: 'Indie rock', name: 'Gallop', s: 'e s s e s s e s s e s s', L: 2, bpm: 100, tip: 'Down, down-up on every beat. Keep it light at the wrist.' },
    { id: 'indie-stop', g: 'Indie rock', name: 'Stop-start eighths', s: 'e> e re e e> e re e', L: 2, bpm: 120, tip: 'Mute on the rests (lift the fretting hand), but keep strumming in the air.' },
    { id: 'blues-128', g: 'Blues', name: 'Slow blues 12/8', ts: '12/8', s: 'e e e e> e e e e e e> e e', L: 2, bpm: 56, tip: 'Feel four big beats, each split in three. Lean into beats 2 and 4.' },
    { id: 'blues-shuffle', g: 'Blues', name: 'Shuffle', s: 'e e e> e e e e> e', L: 2, bpm: 96, swing: true, tip: 'Swung quavers: long-short. Think “trip-let” with the middle note left out.' },
    { id: 'blues-stop', g: 'Blues', name: 'Stop-time hits', s: 'q> rq rh', L: 1, bpm: 84, tip: 'One stab, then silence. Count the rests out loud.' },
    { id: 'funk-16', g: 'Funk', name: 'Sixteenth groove', s: 's> s s s s s s> s s s> s s s s s> s', L: 3, bpm: 92, tip: 'Constant 16ths. Only the accents ring; everything else is a muted scratch.' },
    { id: 'funk-stabs', g: 'Funk', name: 'Syncopated stabs', s: 's> re s rs s> re s s> rs s re s s>', L: 4, bpm: 88, tip: 'Hand never stops in 16ths. Short, choked chords.' },
    { id: 'folk-boomchick', g: 'Folk', name: 'Boom-chick', s: 'q e e q e e', L: 1, bpm: 100, tip: 'Bass note on the beat, strum down-up between. Alternate the bass note each beat.' },
    { id: 'folk-waltz', g: 'Folk', name: 'Folk waltz', ts: '3/4', s: 'q e e e e', L: 1, bpm: 108, tip: 'Bass on 1, light strums on 2 and 3.' },
    { id: 'pop-oldfaithful', g: 'Acoustic pop', name: 'D DU UDU', s: 'q e e~ e e e e', L: 3, bpm: 92, tip: 'The classic campfire strum. Miss the strings on beat 3 but keep the hand moving down.' },
    { id: 'pop-16push', g: 'Acoustic pop', name: 'Sixteenth push', s: 'e s s e e e s s e e', L: 2, bpm: 88, tip: 'Beats 1 and 3 get the extra semiquaver. Light upstrokes.' },
    { id: 'reggae-skank', g: 'Reggae', name: 'Offbeat skank', s: 're e> re e> re e> re e>', L: 1, bpm: 76, tip: 'Short, chopped upstrokes on every &. Release the chord straight away.' },
    { id: 'reggae-24', g: 'Reggae', name: 'Two & four', s: 'rq q> rq q>', L: 1, bpm: 72, tip: 'One drop: the chord lands on 2 and 4 only.' },
    { id: 'reggae-double', g: 'Reggae', name: 'Double chop', s: 're e re s s re e re s s', L: 2, bpm: 74, tip: 'Single chop then a double chop. Keep both very short.' },
    { id: 'soul-comp', g: 'Soul', name: 'Sixteenth comp', s: 'rs s s s> e s s rs s> s s e s s', L: 3, bpm: 84, tip: 'Small chord shapes high up the neck. Ghost the unaccented notes.' },
    { id: 'soul-stabs', g: 'Soul', name: 'Backbeat stabs', s: 'rq q> re s s q>', L: 2, bpm: 88, tip: 'Horn-section stabs. Cut each chord short.' },
    { id: 'country-train', g: 'Country', name: 'Train beat', s: 'e e> e e> e e> e e>', L: 1, bpm: 120, tip: 'Accent the &s for the chugging train feel.' },
    { id: 'country-shuffle', g: 'Country', name: 'Two-step shuffle', s: 'q e e q e e', L: 1, bpm: 104, swing: true, tip: 'Bass on the beat, swung strum after it.' },
    { id: 'swing-charleston', g: 'Shuffle & swing', name: 'Charleston', s: 'q.> e> rh', L: 3, bpm: 120, swing: true, tip: 'Hits on 1 and the & of 2. Short and crisp.' },
    { id: 'swing-four', g: 'Shuffle & swing', name: 'Four to the bar', s: 'q q> q q>', L: 1, bpm: 132, swing: true, tip: 'Quarter-note comping. Lift slightly after each strum.' },
    { id: 'swing-push', g: 'Shuffle & swing', name: 'Anticipated three', s: 'rq e> e~ q rq', L: 3, bpm: 110, swing: true, tip: 'The chord arrives on the & of 2 and is held over beat 3.' },
    { id: 'bb-straight', g: 'Backbeat', name: 'Straight backbeat', s: 'q q> q q>', L: 1, bpm: 96, tip: 'The foundation. Make 2 and 4 clearly louder.' },
    { id: 'bb-pickup', g: 'Backbeat', name: 'Backbeat with pickup', s: 'q q> e e q>', L: 1, bpm: 100, tip: 'Down-up into beat 4.' },
    { id: 'bb-halftime', g: 'Backbeat', name: 'Half-time', s: 'q rq q> rq', L: 1, bpm: 80, tip: 'Big and spacious. The backbeat moves to beat 3.' },
    { id: 's16-push', g: 'Syncopated 16ths', name: 'Anticipations', s: 'e. s~ e e s e s~ e e', L: 4, bpm: 80, tip: 'The last semiquaver of beats 1 and 3 is tied over. Feel the next beat arrive early.' },
    { id: 's16-funky', g: 'Syncopated 16ths', name: 'Sixteenth push', s: 's e s s e s e. s e e', L: 3, bpm: 84, tip: 'The middle of beats 1 and 2 is held. Keep the hand going in 16ths.' },
    { id: 's16-ghost', g: 'Syncopated 16ths', name: 'Ghosted offbeats', s: 'rs s rs s> rs s rs s> rs s rs s> rs s rs s>', L: 5, bpm: 76, tip: 'Only the e and a of each beat. Silent downstrokes on the beat.' },
  ];
  const GENRES = [...new Set(LIB.map((p) => p.g))];
  function libraryExercise(p) {
    const ts = p.ts || '4/4';
    const bars = parse(p.s, ts);
    const ex = { ts, level: p.L, src: 'lib', lib: p.id, name: p.name, genre: p.g, swing: !!p.swing, allDown: !!p.allDown, tip: p.tip, bpm: p.bpm, bars };
    ex.dsl = p.s; ex.id = 'l:' + p.id;
    ex.cats = libCats(ex);
    return ex;
  }
  function libCats(ex) {
    const c = new Set();
    ex.bars.forEach((b) => b.ev.forEach((e) => {
      if (e.tup) c.add(e.tup.n === 6 ? 'sextuplets' : 'triplets');
      else if (e.d === 3 || e.t % 6 === 3) c.add(e.rest ? 'semiquaver rests' : 'semiquavers');
      if (e.dots) c.add('dotted'); if (e.tied) c.add('ties'); if (e.acc) c.add('accents');
      if (!e.rest && !e.tied && e.t % 12 === 6) c.add('offbeats');
    }));
    if (ex.ts.endsWith('/8')) c.add('compound');
    if (!c.size) c.add('crotchets');
    return [...c];
  }

  // ── Attack list (what you actually strum) ──
  function attacks(ex) {
    const out = [];
    let off = 0;
    ex.bars.forEach((b, bi) => { b.ev.forEach((e, ei) => { if (!e.rest && !e.tied) out.push({ bar: bi, ei, t: e.t, abs: off + e.t, acc: e.acc, sub: subClass(b, e) }); }); off += b.len; });
    return out;
  }
  function subClass(bar, e) {
    if (e.tup) return e.tup.n === 6 || e.d === 2 ? 'sextuplet' : 'triplet';
    const g = groupAt(bar, e.t);
    const r = e.t - g.start;
    if (r === 0) return 'on the beat';
    if (g.len === 18) return r % 6 === 0 ? 'compound quaver' : 'semiquaver';
    if (r % 6 === 0) return 'quaver offbeat';
    return 'semiquaver (e/a)';
  }
  function groupAt(bar, t) {
    let s = 0, i = 0;
    for (const g of meter(bar.ts).groups) { if (t < s + g) return { start: s, len: g, i }; s += g; i++; }
    return { start: s, len: 12, i };
  }

  // ── Strumming guide + counting: one slot per grid position, hand never stops ──
  function guide(bar, opts) {
    opts = opts || {};
    const groups = meter(bar.ts).groups;
    const compoundMeter = bar.ts.endsWith('/8');
    // grid per group
    const gInfo = [];
    let s = 0;
    groups.forEach((g, i) => {
      const pts = [];
      bar.ev.forEach((e) => { if (e.t >= s && e.t < s + g) pts.push(e.t - s); if (e.t < s + g && e.t + e.d > s + g) {} });
      // positions inside the group where something begins (incl. rests and held notes)
      const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
      let grid = pts.reduce((a, p) => (p ? gcd2(a, p) : a), g);
      // a note that started earlier and ends inside this group also defines a position
      bar.ev.forEach((e) => { const end = e.t + e.d; if (e.t < s && end > s && end < s + g) grid = gcd2(grid, end - s); });
      let kind = 'straight';
      if (grid % 6 === 0) grid = 6; else if (grid % 4 === 0) { grid = 4; kind = 'triplet'; } else if (grid % 3 === 0) grid = 3; else { grid = 2; kind = 'sextuplet'; }
      if (g === 18) kind = 'compound';
      gInfo.push({ start: s, len: g, grid, kind, i });
      s += g;
    });
    // hand moves in 16ths for the whole bar if any straight beat needs it (keeps the motion even)
    if (!compoundMeter && gInfo.some((x) => x.kind === 'straight' && x.grid === 3)) gInfo.forEach((x) => { if (x.kind === 'straight') x.grid = 3; });
    if (compoundMeter && gInfo.some((x) => x.grid === 3)) gInfo.forEach((x) => { if (x.kind === 'compound' || x.kind === 'straight') x.grid = 3; });
    const slots = [];
    let alt = 0, prevKind = null;
    gInfo.forEach((g) => {
      const alternating = g.kind === 'triplet' || g.kind === 'sextuplet' || g.kind === 'compound';
      if (!alternating || prevKind !== g.kind) alt = 0;
      for (let p = 0; p < g.len; p += g.grid) {
        const t = g.start + p;
        const ev = bar.ev.find((e) => e.t === t);
        const cover = bar.ev.find((e) => e.t <= t && e.t + e.d > t);
        let dir;
        if (opts.allDown) dir = 'D';
        else if (!alternating) dir = (g.grid === 3 ? p % 6 === 0 : p % 12 === 0) ? 'D' : 'U';
        else { dir = alt % 2 === 0 ? 'D' : 'U'; alt++; }
        let type;
        if (ev && !ev.rest && !ev.tied) type = ev.acc ? 'accent' : 'hit';
        else if (cover && cover.rest) type = 'mute';
        else type = 'air';
        slots.push({ t, dir, type, count: countAt(g, p, compoundMeter, groups.length, t), group: g.i, strong: p === 0 });
      }
      prevKind = g.kind;
    });
    return slots;
  }
  function countAt(g, p, compoundMeter, nGroups, t) {
    const beatNo = g.i + 1;
    if (p === 0) return String(beatNo);
    if (g.len === 18 || (compoundMeter && g.len === 12)) {
      if (p % 6 === 0) return p / 6 === 1 ? '&' : 'a';
      return 'ta';
    }
    if (g.kind === 'triplet') return p === 4 ? 'la' : 'li';
    if (g.kind === 'sextuplet' || g.grid === 2) return ({ 2: 'la', 4: 'li', 6: '&', 8: 'la', 10: 'li' })[p] || '·';
    return ({ 3: 'e', 6: '&', 9: 'a' })[p] || '·';
  }

  // ── Playback schedule (relative, in crotchet beats) ──
  function playTimes(bar, swing) {
    // returns [{t (ticks, swung if needed), ei, acc, dir}]
    const g = guide(bar, {});
    return bar.ev.map((e, ei) => ({ e, ei })).filter((x) => !x.e.rest && !x.e.tied).map((x) => {
      let t = x.e.t;
      if (swing && !x.e.tup && t % 12 === 6) t += 2; // 2:1 swing on the & (notated as straight quavers)
      const slot = g.find((s) => s.t === x.e.t);
      return { t, ei: x.ei, acc: x.e.acc, dir: slot ? slot.dir : 'D' };
    });
  }
  function swungTick(t, swing) { return swing && t % 12 === 6 ? t + 2 : t; }

  // ── Onset matching for mic assessment ──
  // expected/detected in seconds (detected already latency-corrected). window = max deviation counted as a hit.
  function score(expected, detected, win) {
    const used = new Array(detected.length).fill(false);
    const hits = [];
    let missed = 0;
    // optimal for monotonic sequences: greedy nearest within window, processing expected in order
    expected.forEach((x) => {
      let best = -1, bd = Infinity;
      detected.forEach((d, i) => { if (used[i]) return; const dd = Math.abs(d - x.time); if (dd <= win && dd < bd) { bd = dd; best = i; } });
      if (best < 0) { missed++; return; }
      used[best] = true;
      hits.push({ err: detected[best] - x.time, sub: x.sub });
    });
    const extra = used.filter((u) => !u).length;
    const errs = hits.map((h) => h.err * 1000);
    const mean = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0;
    const sd = errs.length > 1 ? Math.sqrt(errs.reduce((a, b) => a + (b - mean) ** 2, 0) / (errs.length - 1)) : 0;
    const winMs = win * 1000;
    const hitScore = hits.reduce((a, h) => a + Math.max(0, 1 - Math.max(0, Math.abs(h.err * 1000) - 15) / (winMs - 15)), 0);
    const acc = expected.length ? hitScore / (expected.length + extra) : 0;
    const bySub = {};
    expected.forEach((x) => { (bySub[x.sub] = bySub[x.sub] || { n: 0, s: 0 }).n++; });
    hits.forEach((h) => { bySub[h.sub].s += Math.max(0, 1 - Math.max(0, Math.abs(h.err * 1000) - 15) / (winMs - 15)); });
    return { acc, mean, sd, hit: hits.length, missed, extra, n: expected.length, bySub, tendency: Math.abs(mean) < 8 ? 'centred' : mean < 0 ? 'rushing' : 'dragging' };
  }

  // ── Progress & adaptation ──
  const SELF = { nailed: 1, close: 0.6, struggled: 0.2 };
  function resultScore(r) { return r.mic && r.mic.n ? r.mic.acc : r.self != null ? r.self : null; }
  function newProgress() {
    return { v: 1, level: 1, bars: 1, comfort: { 1: 70, 2: 66, 3: 66, 4: 64, 5: 60 }, results: [], days: {}, daily: {}, pb: {}, settings: {} };
  }
  function catScores(P, n) {
    const by = {};
    (P.results || []).slice(-(n || 60)).forEach((r) => { const s = resultScore(r); if (s == null) return; (r.cats || []).forEach((c) => { (by[c] = by[c] || []).push(s); }); });
    const out = {};
    Object.entries(by).forEach(([c, l]) => { out[c] = { score: l.reduce((a, b) => a + b, 0) / l.length, n: l.length }; });
    return out;
  }
  function adaptWeights(P) {
    const cs = catScores(P);
    const w = {};
    CATS.forEach((c) => { w[c] = cs[c] ? 0.7 + 2.3 * (1 - cs[c].score) : 1.15; });
    return w;
  }
  function weakest(P, k) {
    const cs = catScores(P);
    return Object.entries(cs).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].score - b[1].score).slice(0, k || 3).map(([c, v]) => ({ cat: c, score: v.score, n: v.n }));
  }
  function subAccuracy(P) {
    const by = {};
    (P.results || []).forEach((r) => { if (!r.mic || !r.mic.bySub) return; Object.entries(r.mic.bySub).forEach(([k, v]) => { const b = (by[k] = by[k] || { n: 0, s: 0 }); b.n += v.n; b.s += v.s; }); });
    return Object.entries(by).map(([k, v]) => ({ sub: k, acc: v.n ? v.s / v.n : 0, n: v.n })).sort((a, b) => b.n - a.n);
  }
  function mastered(P) {
    const set = new Set();
    (P.results || []).forEach((r) => { const s = resultScore(r); if (s != null && s >= 0.85) set.add(r.ex); });
    return set;
  }
  function bestBpm(P) {
    const by = {};
    (P.results || []).forEach((r) => { const s = resultScore(r); if (s != null && s >= 0.8 && r.src === 'gen') by[r.level] = Math.max(by[r.level] || 0, r.bpm); });
    return by;
  }
  function record(P, r) {
    P.results = (P.results || []).concat([r]).slice(-600);
    const s = resultScore(r);
    // comfortable tempo nudges up on success, down on a struggle (only for your current level)
    if (s != null && r.level && P.comfort) {
      const c = P.comfort[r.level] || 70;
      if (s >= 0.85 && r.bpm >= c - 2) P.comfort[r.level] = Math.min(200, c + 4);
      else if (s < 0.45) P.comfort[r.level] = Math.max(40, c - 4);
    }
    P.pb = P.pb || {};
    if (r.mic && r.mic.n >= 4 && (!P.pb.acc || r.mic.acc > P.pb.acc.v)) P.pb.acc = { v: r.mic.acc, bpm: r.bpm, date: r.date };
    if (s != null && s >= 0.85 && (!P.pb.bpm || r.bpm > P.pb.bpm.v)) P.pb.bpm = { v: r.bpm, level: r.level, date: r.date };
    return P;
  }
  function levelReady(P) {
    const L = P.level || 1;
    if (L >= 5) return false;
    const recent = (P.results || []).filter((r) => r.level === L && r.src === 'gen').slice(-6);
    if (recent.length < 6) return false;
    const avg = recent.map(resultScore).filter((x) => x != null);
    return avg.length >= 5 && avg.reduce((a, b) => a + b, 0) / avg.length >= 0.8 && (P.comfort[L] || 0) >= 80;
  }
  function addSeconds(P, date, sec) { P.days = P.days || {}; P.days[date] = (P.days[date] || 0) + sec; return P; }
  function dailyStreak(P, today) {
    let n = 0, d = new Date(today + 'T12:00:00Z');
    for (;;) { const k = d.toISOString().slice(0, 10); if (P.daily && P.daily[k] && P.daily[k].done) { n++; d.setUTCDate(d.getUTCDate() - 1); } else break; }
    return n;
  }

  // ── Daily challenge plan ──
  function dailyPlan(P, date) {
    const L = P.level || 1;
    const R = rng(hashStr('rhythm-' + date + '-' + L));
    const adapt = adaptWeights(P);
    const comfort = P.comfort[L] || LEVELS[L - 1].bpm;
    const weak = weakest(P, 1)[0];
    const libPool = LIB.filter((p) => p.L <= L + 1);
    const lib = libPool[Math.floor(R() * libPool.length)];
    const focusAdapt = Object.assign({}, adapt);
    if (weak) focusAdapt[weak.cat] = (focusAdapt[weak.cat] || 1) * 2.5;
    return [
      { key: 'warm', title: 'Rhythmic warm-up', blurb: 'Lock in with the click. Relax the strumming arm.', mode: 'learn', ex: generate({ level: Math.max(1, L - 1), bars: 2, rand: R, ts: '4/4' }), bpm: Math.max(50, comfort - 10), secs: 70 },
      { key: 'sub', title: 'Subdivisions', blurb: weak ? `Extra focus on ${weak.cat}.` : 'Today’s level, played along.', mode: 'learn', ex: generate({ level: L, bars: 2, rand: R, adapt: focusAdapt, ts: L < 5 ? '4/4' : undefined }), bpm: comfort, secs: 90 },
      { key: 'sight', title: 'Sight-reading', blurb: 'Read it, play it, then hear the answer. New rhythm each pass.', mode: 'sight', ex: generate({ level: L, bars: L >= 4 ? 2 : 1, rand: R, adapt }), bpm: Math.max(50, comfort - 6), passes: 3, fresh: true },
      { key: 'call', title: 'Call & response', blurb: 'Listen for a bar, answer for a bar.', mode: 'call', ex: generate({ level: L, bars: 1, rand: R, adapt }), bpm: comfort, passes: 8, fresh: true, hideCall: L >= 2 },
      { key: 'genre', title: `${lib.g}: ${lib.name}`, blurb: lib.tip, mode: 'learn', ex: libraryExercise(lib), bpm: Math.min(lib.bpm, comfort + 10), secs: 90 },
    ];
  }

  const API = { Q, METERS, meter, barLen, parse, parseBar, toDSL, validate, validateBar, generate, LIB, GENRES, libraryExercise, attacks, guide, playTimes, swungTick, score, LEVELS, CATS, SIMPLE, DOUBLE, COMPOUND, rng, hashStr, newProgress, record, catScores, adaptWeights, weakest, subAccuracy, mastered, bestBpm, levelReady, addSeconds, dailyStreak, dailyPlan, resultScore, SELF, markTies };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.RC = API;
})(typeof window !== 'undefined' ? window : globalThis);
