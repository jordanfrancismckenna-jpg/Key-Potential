/* The Key — UI layer. Vanilla JS, hash routing, event delegation. */
(function () {
  const T = window.TK;
  const FIRST_RUN = (() => { try { return !localStorage.getItem(T.KEY); } catch (e) { return true; } })();
  let S = T.load();
  const h = T.esc;
  const $app = document.getElementById('app');
  const $ov = document.getElementById('overlay');
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const RING = { workout: 'Workout', diet: 'Diet', reading: 'Reading' };
  const ui = { calMonth: T.today().slice(0, 7), calView: 'month', trainTab: 'today', finTab: 'overview', nutTab: 'day', nutDate: null, progWeek: null, theme: 'justice', histEx: null, sheet: null };

  /* ---------------- small helpers ---------------- */
  const pct = (x) => (x == null ? '—' : Math.round(x * 100) + '%');
  const save = () => T.save();
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
  function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = val; }
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  let saveT; const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(save, 400); };
  const greeting = () => { const hr = +T.londonNow().time.slice(0, 2); return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; };
  const icon = {
    gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    lock: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    key: '<svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#d4a64a" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="16" r="6"/><path d="M17 16h12M25 16v4M29 16v3"/></svg>',
  };
  const top = (title, { back, eyebrow, right = '' } = {}) => `<div class="topbar"><div class="grow">${back ? `<button class="back" data-a="back" data-to="${h(back)}">‹ Back</button>` : ''}${eyebrow ? `<div class="eyebrow">${h(eyebrow)}</div>` : ''}<h1>${title}</h1></div>${right}</div>`;

  /* ---------------- rings SVG ---------------- */
  function ringSVG(rg, size = 120, w = 11) {
    const gap = w > 8 ? 2.5 : 1.5;
    const radii = [50 - w / 2, 50 - w * 1.5 - gap, 50 - w * 2.5 - gap * 2];
    let s = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">`;
    ['workout', 'diet', 'reading'].forEach((k, i) => {
      const r = radii[i], C = 2 * Math.PI * r, x = rg[k], col = `var(--${k})`;
      if (x.state === 'rest') s += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width="${w * 0.5}" stroke-dasharray="${C / 24} ${C / 24}"/>`;
      else s += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-opacity="${x.state === 'future' ? 0.06 : 0.18}" stroke-width="${w}"/>`;
      if (x.pct > 0) s += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.max(x.pct, 0.02))}" transform="rotate(-90 50 50)"/>`;
    });
    return s + '</svg>';
  }
  function ringLegend(rg) {
    return ['workout', 'diet', 'reading'].map((k) => {
      const x = rg[k];
      const v = x.state === 'rest' ? 'Rest' : x.state === 'future' ? '—' : pct(x.pct);
      return `<div class="item"><span class="dot" style="background:var(--${k})"></span><div class="grow"><div class="lbl">${RING[k]}</div><div class="small muted">${h(x.detail || (x.state === 'unlogged' ? 'Not logged yet' : ''))}</div></div><div class="v" style="color:var(--${k})">${v}</div></div>`;
    }).join('');
  }

  /* ---------------- charts (tiny, dependency-free) ---------------- */
  function lineChart(pts, { color = 'var(--gold)', h: H = 140, fmt = (v) => v, ref = null } = {}) {
    const P = pts.filter((p) => p.y != null);
    if (P.length < 2) return '<div class="empty small">Not enough data yet — log at least two entries.</div>';
    const W = 320, pad = 26;
    let ys = P.map((p) => p.y); if (ref != null) ys.push(ref);
    let lo = Math.min(...ys), hi = Math.max(...ys); if (lo === hi) { lo -= 1; hi += 1; }
    const X = (i) => pad + (i / (pts.length - 1)) * (W - pad - 6), Y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * (H - 30);
    const d = pts.map((p, i) => (p.y == null ? null : [X(i), Y(p.y)])).filter(Boolean).map((xy, i) => (i ? 'L' : 'M') + xy[0].toFixed(1) + ' ' + xy[1].toFixed(1)).join(' ');
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}">`;
    s += `<text x="2" y="${Y(hi) + 4}" fill="var(--faint)" font-size="9">${h(fmt(hi))}</text><text x="2" y="${Y(lo) + 4}" fill="var(--faint)" font-size="9">${h(fmt(lo))}</text>`;
    s += `<line x1="${pad}" x2="${W}" y1="${Y(lo)}" y2="${Y(lo)}" stroke="var(--line)"/><line x1="${pad}" x2="${W}" y1="${Y(hi)}" y2="${Y(hi)}" stroke="var(--line)" stroke-dasharray="2 3"/>`;
    if (ref != null) s += `<line x1="${pad}" x2="${W}" y1="${Y(ref)}" y2="${Y(ref)}" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${W - 4}" y="${Y(ref) - 3}" text-anchor="end" fill="var(--bad)" font-size="9">alert ${h(fmt(ref))}</text>`;
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const last = P[P.length - 1], li = pts.indexOf(last);
    s += `<circle cx="${X(li)}" cy="${Y(last.y)}" r="3.5" fill="${color}"/>`;
    s += `<text x="${pad}" y="${H - 4}" fill="var(--faint)" font-size="9">${h(pts[0].x)}</text><text x="${W - 2}" y="${H - 4}" text-anchor="end" fill="var(--faint)" font-size="9">${h(pts[pts.length - 1].x)}</text>`;
    return s + '</svg>';
  }

  /* ================= VIEWS ================= */

  /* ---------- HOME ---------- */
  function vHome() {
    const d = T.today(), ci = T.cycleInfo(d), rg = T.rings(d), plan = T.planFor(d);
    let out = top(`${greeting()}`, { eyebrow: 'The Key · ' + T.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }), right: `<a class="icon-btn" href="#/settings" aria-label="Settings">${icon.gear}</a>` });
    if (ui.update) out += `<div class="card tight" style="border-color:var(--gold)" data-a="updateSheet"><div class="row between"><div><div class="eyebrow">Setup update available</div><div class="small">${h(ui.update.note || 'New data for your personal setup')}</div></div><span class="btn primary sm">Apply</span></div></div>`;
    if (ci) {
      const left = T.diffDays(d, ci.end);
      out += `<div class="card tight" data-a="cycleSheet" data-id="${ci.id}" style="cursor:pointer"><div class="row between"><div><div class="eyebrow">${h(ci.name)} <span style="opacity:.6">· edit</span></div><div class="serif" style="font-size:20px">${ci.active ? `Day ${ci.day} of ${ci.total} · Week ${ci.week}` : d < ci.start ? `Starts ${T.fmtDate(ci.start)}` : 'Cycle complete'}</div></div><div class="small muted" style="text-align:right">${ci.active ? `${left} days left<br>ends ${T.fmtDate(ci.end, { day: 'numeric', month: 'short' })}` : ''}</div></div><div class="bar" style="margin-top:10px"><i style="width:${Math.round(ci.pct * 100)}%"></i></div></div>`;
    }
    out += `<div class="card" data-a="openDay" data-d="${d}" style="cursor:pointer"><div class="card-head"><h3>Today's rings</h3><span class="link">Details ›</span></div><div class="rings-hero">${ringSVG(rg, 132, 12)}<div class="ring-legend">${ringLegend(rg)}</div></div></div>`;

    // training
    const sess = T.sessionsOn(d), runs = T.runsOn(d);
    let tr = '';
    if (plan.type === 'gym') {
      const t = T.tpl(plan.templateId);
      const open = sess.find((s) => s.templateId === plan.templateId);
      tr = `<div class="row between"><div><div class="serif" style="font-size:19px">${h(t?.name || 'Gym')} day</div><div class="small muted">${t ? `${t.exercises.length} exercises · ${T.plannedSetCount(t)} sets planned` : ''}${t && !t.exercises.length ? ' · routine not set yet' : ''}</div></div><button class="btn primary sm" data-a="${open ? 'goSession' : 'startSession'}" data-id="${open ? open.id : plan.templateId}">${open ? 'Continue' : 'Start'}</button></div>`;
    } else if (plan.type === 'run') {
      tr = `<div class="row between"><div><div class="serif" style="font-size:19px">${h(plan.label || 'Run')}</div><div class="small muted">${plan.target} min${plan.optional ? ' · optional — rest is fine' : ''}</div></div><button class="btn primary sm" data-a="runSheet" data-d="${d}">Log run</button></div>`;
    } else tr = `<div class="row between"><div><div class="serif" style="font-size:19px">Rest & recover</div><div class="small muted">${h(plan.label || 'No training scheduled. Rest days never break your rings.')}</div></div><button class="btn sm" data-a="runSheet" data-d="${d}">Log activity</button></div>`;
    if (sess.length || runs.length) tr += `<div class="small muted" style="margin-top:8px">Logged: ${sess.map((s) => h(s.name)).join(', ')}${sess.length && runs.length ? ' · ' : ''}${runs.map((r) => `${r.min} min ${h(r.type)}`).join(', ')}</div>`;
    out += `<div class="card"><div class="card-head"><h3><span class="dot" style="background:var(--workout)"></span> Training</h3><a href="#/training">Open ›</a></div>${tr}</div>`;

    // meals
    const now = T.londonNow().time, logs = T.mealLogs(d), mp = T.mealsPlanned(d), nut = T.dayNutrition(d);
    const nextIdx = mp.findIndex((m) => m.time >= now && !logs.some((l) => l.planned && l.time === m.time));
    out += `<div class="card"><div class="card-head"><h3><span class="dot" style="background:var(--diet)"></span> ${S.nutrition.plans[T.dayType(d)].label}</h3><a href="#/nutrition">Plan ›</a></div><ul class="list">${mp.map((m, i) => {
      const lg = logs.find((l) => l.planned && l.time === m.time);
      const name = lg && lg.mealId !== m.mealId ? (T.meal(lg.mealId)?.name || lg.name) + ' (swap)' : m.meal?.name || 'Meal';
      return `<li class="meal-row"><span class="meal-time">${m.time}</span><div class="grow"><div style="${i === nextIdx ? 'color:var(--gold2);font-weight:600' : ''}">${h(name)}</div><div class="tiny muted">${m.meal?.kcal ? Math.round(m.meal.kcal) + ' kcal' + (m.meal.p != null ? ' · ' + Math.round(m.meal.p) + 'g protein' : '') : 'kcal not set'}${i === nextIdx ? ' · up next' : ''}</div></div><button class="chk ${lg ? 'on' : ''}" data-a="toggleMeal" data-d="${d}" data-mid="${m.mealId}" data-time="${m.time}" aria-label="Mark eaten">${icon.check}</button></li>`;
    }).join('')}</ul><div class="small muted" style="margin-top:6px">${nut.count ? `Logged ${nut.kcal.toLocaleString()} kcal${nut.unknown ? ` + ${nut.unknown} meal(s) without kcal data` : ''} · target ${S.nutrition.targets.kcal.toLocaleString()}` : `Target ${S.nutrition.targets.kcal.toLocaleString()} kcal · ${S.nutrition.targets.p} g protein`}</div></div>`;

    // study
    const min = T.studyMinutes(d), goal = S.settings.readingGoalMin;
    const nextMod = nextModule();
    out += `<div class="card"><div class="card-head"><h3><span class="dot" style="background:var(--reading)"></span> Study</h3><a href="#/academy">Academy ›</a></div><div class="row between"><div><div class="serif" style="font-size:19px">${min} / ${goal} min</div><div class="small muted">${nextMod ? `Next: ${h(nextMod.c.title)} · Wk ${nextMod.i + 1} — ${h(nextMod.w.t)}` : 'All modules complete'}</div></div><button class="btn sm" data-a="studySheet" data-d="${d}">+ Log</button></div>${nextMod ? `<a class="btn block" style="margin-top:12px" href="#/module/${nextMod.c.id}/${nextMod.i}">Continue course</a>` : ''}</div>`;

    // money
    out += homeMoney(d);

    // lock-in strip
    out += `<a class="card tight" href="#/lockin" style="display:block;text-decoration:none;color:inherit"><div class="row between"><div class="eyebrow">Lock-in</div><span class="link">Reference ›</span></div><div class="row wrap" style="margin-top:8px;gap:6px">${((S.personal && S.personal.lockin) || []).filter((x) => !/gym|counsel/i.test(x.k)).map((x) => `<span class="pill">${h(x.k)} · ${h(x.d)}</span>`).join('') || '<span class="small muted">Unlock your personal setup to see your commitments.</span>'}</div></a>`;
    return out;
  }
  function homeMoney(d) {
    const p = T.projectedBalance(d);
    const up = T.occurrences(d, T.addDays(d, 7));
    const und = T.undated();
    let body = '';
    if (p) body += `<div class="row between"><div><div class="small muted">Projected balance today</div><div class="serif" style="font-size:24px">${T.gbp(p.balance)}</div></div><div class="tiny muted" style="text-align:right">from your bank figure<br>on ${T.fmtDate(p.anchor.date)}</div></div>`;
    else body += `<div class="notice">Add your current bank balance to unlock date-by-date projections. <a href="#/finance" data-a="finTab" data-t="setup">Set up ›</a></div>`;
    if (p) {
      const series = T.forecastSeries(d, 30).filter((x) => x.bal != null);
      const low = series.reduce((m, x) => (x.bal < m.bal ? x : m), series[0]);
      if (low && low.bal < S.settings.lowBalance) body += `<div class="notice" style="margin-top:10px">⚠️ Projected to dip to ${T.gbp(low.bal)} on ${T.fmtDate(low.date)} (below your ${T.gbp(S.settings.lowBalance)} alert).</div>`;
    }
    if (up.length) body += `<ul class="list" style="margin-top:8px">${up.slice(0, 5).map((o) => `<li class="row between"><div><div>${h(o.name)}</div><div class="tiny muted">${T.fmtDate(o.date)} · ${o.status}</div></div><div class="${o.amount > 0 ? 'good' : ''}" style="font-variant-numeric:tabular-nums">${o.amount > 0 ? '+' : ''}${T.gbp(o.amount)}</div></li>`).join('')}</ul>`;
    else if (und.length) body += `<div class="small muted" style="margin-top:8px">${und.length} bill(s) still need a payment date before they appear here.</div>`;
    return `<div class="card"><div class="card-head"><h3>💷 Money</h3><a href="#/finance">Finance ›</a></div>${body}</div>`;
  }
  function nextModule() {
    let best = null;
    for (const c of window.TK_COURSES) {
      const i = c.weeks.findIndex((_, i) => { const p = S.study.progress[T.modKey(c.id, i)] || {}; return !(p.read && p.lecture); });
      if (i >= 0 && (!best || i < best.i)) best = { c, i, w: c.weeks[i] };
    }
    return best;
  }

  /* ---------- CALENDAR ---------- */
  function vCalendar() {
    const [y, m] = ui.calMonth.split('-').map(Number);
    const first = `${ui.calMonth}-01`, dim = T.daysInMonth(y, m), last = `${ui.calMonth}-${String(dim).padStart(2, '0')}`;
    const label = T.toD(first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const td = T.today(), ci = T.currentCycle(td);
    let out = top('The Key Rings', { eyebrow: 'Calendar' });
    out += `<div class="row between" style="margin-bottom:12px"><button class="icon-btn" data-a="calMove" data-n="-1" aria-label="Previous">‹</button><div class="serif" style="font-size:20px">${label}</div><button class="icon-btn" data-a="calMove" data-n="1" aria-label="Next">›</button></div>`;
    out += `<div class="seg" style="margin-bottom:12px"><button class="${ui.calView === 'month' ? 'on' : ''}" data-a="calView" data-v="month">Month</button><button class="${ui.calView === 'week' ? 'on' : ''}" data-a="calView" data-v="week">Week</button><button data-a="calToday">Today</button></div>`;
    if (ui.calView === 'month') {
      out += `<div class="card" style="padding:10px"><div class="cal-head">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => `<div>${x}</div>`).join('')}</div><div class="cal">`;
      const start = T.startOfWeek(first), end = T.addDays(T.startOfWeek(last), 6);
      for (const d of T.range(start, end)) {
        const out_ = d.slice(0, 7) !== ui.calMonth;
        const inc = ci && d >= ci.start && d <= ci.end;
        out += `<button class="cell ${d === td ? 'today' : ''} ${out_ ? 'out' : ''} ${inc ? 'incycle' : ''}" data-a="openDay" data-d="${d}" aria-label="${T.fmtDate(d)}"><span class="n">${+d.slice(8)}</span>${ringSVG(T.rings(d), 44, 9)}</button>`;
      }
      out += `</div></div>`;
    } else {
      const ws = T.startOfWeek(ui.weekStart || td);
      out += `<div class="row between" style="margin-bottom:8px"><button class="btn sm" data-a="weekMove" data-n="-7">‹ Prev</button><div class="small muted">Week of ${T.fmtDate(ws, { day: 'numeric', month: 'short' })}</div><button class="btn sm" data-a="weekMove" data-n="7">Next ›</button></div><div class="card">`;
      for (const d of T.range(ws, T.addDays(ws, 6))) {
        const rg = T.rings(d);
        out += `<div class="weekrow" data-a="openDay" data-d="${d}">${ringSVG(rg, 54, 10)}<div class="grow"><div style="font-weight:600${d === td ? ';color:var(--gold2)' : ''}">${T.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</div><div class="tiny muted">${['workout', 'diet', 'reading'].map((k) => `<span style="color:var(--${k})">●</span> ${rg[k].state === 'rest' ? 'rest' : rg[k].state === 'future' ? '—' : pct(rg[k].pct)}`).join(' &nbsp; ')}</div></div><span class="faint">›</span></div>`;
      }
      out += '</div>';
    }
    const days = T.range(first, last <= td ? last : td < first ? first : td).filter((d) => d <= td);
    const av = T.ringAverages(days);
    out += `<div class="card"><h3>${label.split(' ')[0]} so far</h3><div class="grid3" style="margin-top:10px">${['workout', 'diet', 'reading'].map((k) => `<div class="kpi"><div class="v" style="color:var(--${k})">${pct(av[k])}</div><div class="l">${RING[k]}</div><div class="tiny muted">${av[k + 'Closed']}/${av[k + 'Days']} closed</div></div>`).join('')}</div><p class="tiny muted" style="margin-bottom:0">Averages exclude rest days and future days. Dashed ring = rest day (never counted against you). Faint ring = nothing logged.</p></div>`;
    return out;
  }

  /* ---------- DAY SHEET ---------- */
  function sheetDay(d) {
    const rg = T.rings(d), plan = T.planFor(d), st = S.dayStatus[d];
    const sess = T.sessionsOn(d), runs = T.runsOn(d), logs = T.mealLogs(d), study = S.study.log.filter((x) => x.date === d);
    const occ = T.occurrences(d, d);
    let s = `<div class="row between"><div><div class="eyebrow">${d === T.today() ? 'Today' : T.fmtDate(d, { weekday: 'long' })}</div><h2>${T.fmtDate(d, { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div>`;
    s += `<div class="rings-hero" style="margin:14px 0">${ringSVG(rg, 110, 12)}<div class="ring-legend">${ringLegend(rg)}</div></div>`;
    s += `<div class="small muted">Plan: ${plan.type === 'gym' ? h(T.tpl(plan.templateId)?.name || 'Gym') + ' session' : plan.type === 'run' ? h(plan.label || 'Run') + ` (${plan.target} min)` : h(plan.label || 'Rest')}</div>`;
    s += `<div class="seg" style="margin:10px 0 4px"><button class="${!st ? 'on' : ''}" data-a="dayStatus" data-d="${d}" data-v="">As planned</button><button class="${st === 'rest' ? 'on' : ''}" data-a="dayStatus" data-d="${d}" data-v="rest">Rest day</button><button class="${st === 'ill' ? 'on' : ''}" data-a="dayStatus" data-d="${d}" data-v="ill">Unwell</button></div>`;
    // workout
    s += `<hr class="sep"><div class="row between"><h3 style="color:var(--workout)">Workout</h3><div class="row"><button class="btn sm" data-a="pickSession" data-d="${d}">+ Session</button><button class="btn sm" data-a="runSheet" data-d="${d}">+ Run</button></div></div>`;
    s += sess.length || runs.length ? `<ul class="list">${sess.map((x) => `<li class="row between"><a href="#/session/${x.id}" data-a="closeSheet" data-nav="#/session/${x.id}" class="grow" style="text-decoration:none;color:inherit"><div>${h(x.name)}</div><div class="tiny muted">${T.workSets(x).length} working sets${x.min ? ` · ${x.min} min` : ''}</div></a><span class="faint">›</span></li>`).join('')}${runs.map((r) => `<li class="row between"><div class="grow"><div>${h(r.type)} · ${r.min} min${r.km ? ` · ${r.km} km` : ''}</div><div class="tiny muted">${r.km && r.min ? paceStr(r.min, r.km) + ' /km' : ''}${r.hr ? ` · ${r.hr} bpm` : ''}${r.note ? ' · ' + h(r.note) : ''}</div></div><button class="icon-btn" data-a="runSheet" data-d="${d}" data-id="${r.id}">✎</button></li>`).join('')}</ul>` : '<div class="empty small">Nothing logged.</div>';
    // diet
    s += `<hr class="sep"><div class="row between"><h3 style="color:var(--diet)">Diet · ${S.nutrition.plans[T.dayType(d)].label}</h3><button class="btn sm" data-a="foodSheet" data-d="${d}">+ Food</button></div><ul class="list">`;
    for (const m of T.mealsPlanned(d)) {
      const lg = logs.find((l) => l.planned && l.time === m.time);
      s += `<li class="meal-row"><span class="meal-time">${m.time}</span><div class="grow">${h(lg && lg.mealId !== m.mealId ? T.meal(lg.mealId)?.name : m.meal?.name)}${lg && lg.portion !== 1 ? ` <span class="pill">×${lg.portion}</span>` : ''}</div><button class="chk ${lg ? 'on' : ''}" data-a="toggleMeal" data-d="${d}" data-mid="${m.mealId}" data-time="${m.time}">${icon.check}</button></li>`;
    }
    for (const l of logs.filter((l) => !l.planned)) s += `<li class="meal-row"><span class="meal-time">${h(l.time || '')}</span><div class="grow">${h(l.name)} <span class="tiny muted">${l.kcal != null ? l.kcal + ' kcal' : ''}</span></div><button class="icon-btn" data-a="delFood" data-d="${d}" data-id="${l.id}">${icon.x}</button></li>`;
    s += '</ul>';
    // study
    s += `<hr class="sep"><div class="row between"><h3 style="color:var(--reading)">Reading & study</h3><button class="btn sm" data-a="studySheet" data-d="${d}">+ Study</button></div>`;
    s += study.length ? `<ul class="list">${study.map((x) => `<li class="row between"><div class="grow"><div>${h(T.course(x.course)?.title || 'General reading')} · ${x.min} min</div><div class="tiny muted">${h(x.kind || 'reading')}${x.pages ? ` · ${x.pages} pages` : ''}${x.note ? ' · ' + h(x.note) : ''}</div></div><button class="icon-btn" data-a="delStudy" data-id="${x.id}">${icon.x}</button></li>`).join('')}</ul>` : '<div class="empty small">Nothing logged.</div>';
    if (occ.length) s += `<hr class="sep"><h3>💷 Money on this day</h3><ul class="list">${occ.map((o) => `<li class="row between"><span>${h(o.name)} <span class="tiny muted">${o.status}</span></span><span>${T.gbp(o.amount)}</span></li>`).join('')}</ul>`;
    return s;
  }
  const paceStr = (min, km) => { const p = min / km; const mm = Math.floor(p), ss = Math.round((p - mm) * 60); return `${mm}:${String(ss).padStart(2, '0')}`; };

  function sheetPickSession(d) {
    return `<div class="row between"><h2>Log a session</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><p class="muted small">${T.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</p><div class="stack">${S.templates.map((t) => `<button class="btn block" data-a="startSession" data-id="${t.id}" data-d="${d}">${h(t.name)}</button>`).join('')}<button class="btn block ghost" data-a="startSession" data-id="" data-d="${d}">Empty session</button></div>`;
  }
  function sheetRun(d, id) {
    const r = id ? S.runs.find((x) => x.id === id) : { date: d, type: 'Zone 2', min: S.schedule[T.weekday(d)]?.target || 30 };
    return `<div class="row between"><h2>${id ? 'Edit' : 'Log'} run / activity</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><form data-f="run" data-id="${id || ''}">
      <label class="f">Date</label><input type="date" name="date" value="${r.date}" required>
      <label class="f">Type</label><select name="type">${['Zone 2', 'parkrun', 'Tempo', 'Intervals', 'Long run', 'Walk', 'Active recovery', 'Other'].map((t) => `<option ${t === r.type ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">Duration (min)</label><input type="number" name="min" inputmode="decimal" value="${r.min ?? ''}" required></div><div><label class="f">Distance (km)</label><input type="number" step="0.01" name="km" inputmode="decimal" value="${r.km ?? ''}"></div></div>
      <div class="grid2"><div><label class="f">Avg heart rate</label><input type="number" name="hr" value="${r.hr ?? ''}"></div><div><label class="f">Zone</label><input type="text" name="zone" value="${h(r.zone || '')}" placeholder="e.g. Z2"></div></div>
      <label class="f">Notes</label><input type="text" name="note" value="${h(r.note || '')}">
      <div class="row" style="margin-top:14px">${id ? `<button type="button" class="btn danger" data-a="delRun" data-id="${id}">Delete</button>` : ''}<button class="btn primary grow">Save</button></div></form>`;
  }
  function sheetStudy(d, course) {
    return `<div class="row between"><h2>Log study</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><form data-f="study">
      <label class="f">Date</label><input type="date" name="date" value="${d}" required>
      <label class="f">Course</label><select name="course"><option value="">General reading</option>${window.TK_COURSES.map((c) => `<option value="${c.id}" ${c.id === course ? 'selected' : ''}>${h(c.title)}</option>`).join('')}</select>
      <label class="f">Activity</label><select name="kind">${['reading', 'lecture', 'video', 'quiz', 'discussion', 'reflection / essay', 'revision'].map((k) => `<option>${k}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">Minutes</label><input type="number" name="min" value="30" required></div><div><label class="f">Pages (optional)</label><input type="number" name="pages"></div></div>
      <label class="f">Note</label><input type="text" name="note" placeholder="Chapter, idea…">
      <button class="btn primary block" style="margin-top:14px">Save</button></form>`;
  }
  function sheetFood(d) {
    return `<div class="row between"><h2>Add food</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><form data-f="food" data-d="${d}">
      <label class="f">From your meals</label><select name="mealId"><option value="">— custom food —</option>${S.nutrition.meals.map((m) => `<option value="${m.id}">${h(m.name)}${m.kcal ? ` (${m.kcal} kcal)` : ''}</option>`).join('')}</select>
      <label class="f">Custom name</label><input type="text" name="name" placeholder="e.g. Protein shake">
      <div class="grid2"><div><label class="f">kcal</label><input type="number" name="kcal"></div><div><label class="f">Protein g</label><input type="number" name="p"></div></div>
      <div class="grid2"><div><label class="f">Carbs g</label><input type="number" name="c"></div><div><label class="f">Fat g</label><input type="number" name="f"></div></div>
      <div class="grid2"><div><label class="f">Portion</label><select name="portion">${[0.5, 0.75, 1, 1.25, 1.5, 2].map((p) => `<option ${p === 1 ? 'selected' : ''}>${p}</option>`).join('')}</select></div><div><label class="f">Time</label><input type="time" name="time" value="${T.londonNow().time}"></div></div>
      <button class="btn primary block" style="margin-top:14px">Add</button></form>`;
  }

  /* ---------- TRAINING ---------- */
  function vTraining() {
    let out = top('Training', { eyebrow: 'Strength · Running · Body' });
    const tabs = [['today', 'Today'], ['plan', 'Plan'], ['history', 'History'], ['runs', 'Runs'], ['body', 'Body']];
    out += `<div class="seg" style="margin-bottom:14px">${tabs.map(([k, l]) => `<button class="${ui.trainTab === k ? 'on' : ''}" data-a="trainTab" data-t="${k}">${l}</button>`).join('')}</div>`;
    return out + ({ today: tToday, plan: tPlan, history: tHistory, runs: tRuns, body: tBody }[ui.trainTab])();
  }
  function tToday() {
    const d = T.today(), plan = T.planFor(d);
    const recent = [...S.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created).slice(0, 5);
    let out = `<div class="card"><div class="eyebrow">${WDL[T.weekday(d)]}</div><h2 style="margin:4px 0 12px">${plan.type === 'gym' ? h(T.tpl(plan.templateId)?.name || 'Gym') + ' day' : plan.type === 'run' ? h(plan.label || 'Run day') : 'Rest day'}</h2>`;
    out += `<div class="stack">${S.templates.map((t) => `<button class="btn block ${plan.templateId === t.id ? 'primary' : ''}" data-a="startSession" data-id="${t.id}">Start ${h(t.name)}${t.exercises.length ? '' : ' (empty)'}</button>`).join('')}<button class="btn block ghost" data-a="runSheet" data-d="${d}">Log a run</button></div></div>`;
    const legs = T.tpl('legs');
    if (legs && !legs.exercises.length) out += `<div class="notice">Your Legs + Core routine hasn't been entered yet. Add it under <a href="#" data-a="trainTab" data-t="plan">Plan</a> — legs and core are your stated priority this cycle.</div>`;
    out += `<div class="card"><h3>Recent sessions</h3>${recent.length ? `<ul class="list">${recent.map((s) => `<li><a href="#/session/${s.id}" class="row between" style="text-decoration:none;color:inherit"><div><div>${h(s.name)}</div><div class="tiny muted">${T.fmtDate(s.date)} · ${T.workSets(s).length} sets · ${Math.round(volume(s)).toLocaleString()} kg volume</div></div><span class="faint">›</span></a></li>`).join('')}</ul>` : '<div class="empty">No sessions yet. Start one above — your baseline weights are pre-filled.</div>'}</div>`;
    return out;
  }
  const volume = (s) => T.workSets(s).reduce((a, x) => a + (+x.w || 0) * (+x.r || 0), 0);

  function tPlan() {
    let out = `<div class="card"><h3>Weekly schedule</h3><p class="small muted" style="margin-top:0">Gym Mon / Wed / Sun and Saturday run are from your lock-in. Which session falls on which day is my assumption — change freely.</p><ul class="list">`;
    for (const w of [1, 2, 3, 4, 5, 6, 0]) {
      const p = S.schedule[w] || { type: 'rest' };
      out += `<li><div class="row between"><strong style="width:44px">${WD[w]}</strong><select class="grow" data-c="schedType" data-w="${w}"><option value="rest" ${p.type === 'rest' ? 'selected' : ''}>Rest</option>${S.templates.map((t) => `<option value="gym:${t.id}" ${p.type === 'gym' && p.templateId === t.id ? 'selected' : ''}>Gym — ${h(t.name)}</option>`).join('')}<option value="run" ${p.type === 'run' && !p.optional ? 'selected' : ''}>Run</option><option value="run-opt" ${p.type === 'run' && p.optional ? 'selected' : ''}>Optional run</option></select>${p.type === 'run' ? `<input type="number" style="width:76px" value="${p.target}" data-c="schedTarget" data-w="${w}" aria-label="Minutes">` : ''}</div></li>`;
    }
    out += `</ul></div><div class="card"><div class="card-head"><h3>Session templates</h3><button class="link" data-a="addTemplate">+ New</button></div><ul class="list">${S.templates.map((t) => `<li><a href="#/template/${t.id}" class="row between" style="text-decoration:none;color:inherit"><div><div>${h(t.name)}</div><div class="tiny muted">${t.exercises.length ? t.exercises.map((e) => h(e.name)).join(' · ') : 'No exercises yet'}</div></div><span class="faint">›</span></a></li>`).join('')}</ul></div>`;
    return out;
  }
  function vTemplate(id) {
    const t = T.tpl(id); if (!t) return top('Not found', { back: '#/training' });
    let out = top(h(t.name), { back: '#/training', eyebrow: 'Template' });
    out += `<div class="card"><label class="f">Name</label><input type="text" value="${h(t.name)}" data-bind="templates.${S.templates.indexOf(t)}.name">${t.note ? `<p class="small warn">${h(t.note)}</p>` : ''}</div>`;
    t.exercises.forEach((e, i) => {
      out += `<div class="ex"><div class="row"><input type="text" class="grow" value="${h(e.name)}" data-bind="templates.${S.templates.indexOf(t)}.exercises.${i}.name"><button class="icon-btn" data-a="exMove" data-t="${id}" data-i="${i}" data-n="-1">${icon.up}</button><button class="icon-btn" data-a="exMove" data-t="${id}" data-i="${i}" data-n="1">${icon.down}</button><button class="icon-btn" data-a="exDel" data-t="${id}" data-i="${i}">${icon.x}</button></div>
        <div class="grid3" style="margin-top:8px"><div><label class="f">Rep low</label><input type="number" value="${e.repLow ?? ''}" data-bind="templates.${S.templates.indexOf(t)}.exercises.${i}.repLow" data-type="num"></div><div><label class="f">Rep high</label><input type="number" value="${e.repHigh ?? ''}" data-bind="templates.${S.templates.indexOf(t)}.exercises.${i}.repHigh" data-type="num"></div><div><label class="f">+kg step</label><input type="number" step="0.5" value="${e.inc ?? 2.5}" data-bind="templates.${S.templates.indexOf(t)}.exercises.${i}.inc" data-type="num"></div></div>
        <label class="f">Baseline sets (kg × reps)</label><div class="row wrap" style="gap:6px">${e.sets.map((s, si) => `<span class="pill">${s.w ?? '?'}×${s.r ?? '?'} <button class="link" data-a="tsetDel" data-t="${id}" data-i="${i}" data-s="${si}" style="color:var(--faint)">✕</button></span>`).join('')}<button class="btn sm" data-a="tsetAdd" data-t="${id}" data-i="${i}">+ set</button></div>
        <label class="f">Note</label><input type="text" value="${h(e.note || '')}" data-bind="templates.${S.templates.indexOf(t)}.exercises.${i}.note"></div>`;
    });
    out += `<div class="card"><h3>Add exercise</h3><div class="row"><select id="libPick" class="grow"><option value="">Choose from library…</option>${S.library.map((n) => `<option>${h(n)}</option>`).join('')}</select><button class="btn" data-a="exAdd" data-t="${id}">Add</button></div><label class="f">…or custom</label><div class="row"><input type="text" id="libCustom" class="grow" placeholder="Exercise name"><button class="btn" data-a="exAdd" data-t="${id}" data-custom="1">Add</button></div></div>`;
    if (!['push', 'pull', 'legs'].includes(id)) out += `<button class="btn danger block" data-a="delTemplate" data-t="${id}">Delete template</button>`;
    return out;
  }

  function vSession(id) {
    const s = S.sessions.find((x) => x.id === id); if (!s) return top('Session not found', { back: '#/training' });
    const si = S.sessions.indexOf(s);
    let out = top(h(s.name), { back: '#/training', eyebrow: T.fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'short' }) });
    out += `<div class="card tight"><div class="grid2"><div><label class="f" style="margin-top:0">Date</label><input type="date" value="${s.date}" data-bind="sessions.${si}.date" data-rerender></div><div><label class="f" style="margin-top:0">Duration (min)</label><input type="number" value="${s.min ?? ''}" data-bind="sessions.${si}.min" data-type="num"></div></div><div class="row" style="margin-top:10px;gap:6px">${[60, 90, 120, 180].map((x) => `<button class="btn sm" data-a="timer" data-s="${x}">⏱ ${x < 120 ? x + 's' : x / 60 + 'm'}</button>`).join('')}</div></div>`;
    s.exercises.forEach((e, ei) => {
      const hist = T.exerciseHistory(e.name).filter((x) => x.date < s.date || x.date === s.date && false);
      const prev = hist[hist.length - 1];
      const tplEx = (T.tpl(s.templateId)?.exercises || []).find((x) => x.name === e.name) || e;
      const sug = T.suggestNext({ ...tplEx, name: e.name });
      out += `<div class="ex"><div class="row between"><strong class="grow">${h(e.name)}</strong><button class="icon-btn" data-a="sExDel" data-s="${id}" data-e="${ei}" aria-label="Remove">${icon.x}</button></div>${e.note ? `<div class="tiny muted">${h(e.note)}</div>` : ''}${prev ? `<div class="tiny muted">Last: ${T.fmtDate(prev.date)} — ${prev.sets.map((x) => `${x.w}×${x.r}`).join(', ')}</div>` : ''}
        <div class="sets"><div class="h">Set</div><div class="h">kg</div><div class="h">Reps</div><div class="h">RPE</div><div class="h"></div>
        ${e.sets.map((x, xi) => `<div class="setno ${x.warmup ? 'wu' : ''}" data-a="setWarm" data-s="${id}" data-e="${ei}" data-x="${xi}" title="Tap to toggle warm-up">${x.warmup ? 'W' : xi + 1 - e.sets.slice(0, xi).filter((q) => q.warmup).length}</div><input type="number" inputmode="decimal" step="0.5" value="${x.w ?? ''}" data-bind="sessions.${si}.exercises.${ei}.sets.${xi}.w" data-type="num"><input type="number" inputmode="numeric" value="${x.r ?? ''}" data-bind="sessions.${si}.exercises.${ei}.sets.${xi}.r" data-type="num"><input type="number" inputmode="decimal" step="0.5" min="1" max="10" value="${x.rpe ?? ''}" data-bind="sessions.${si}.exercises.${ei}.sets.${xi}.rpe" data-type="num"><button class="chk ${x.done ? 'on' : ''}" data-a="setDone" data-s="${id}" data-e="${ei}" data-x="${xi}">${icon.check}</button>`).join('')}</div>
        <div class="row" style="margin-top:8px"><button class="btn sm" data-a="setAdd" data-s="${id}" data-e="${ei}">+ Set</button>${e.sets.length ? `<button class="btn sm ghost" data-a="setDel" data-s="${id}" data-e="${ei}">− Last</button>` : ''}<input type="text" class="grow" placeholder="Notes" value="${h(e.notes || '')}" data-bind="sessions.${si}.exercises.${ei}.notes" style="min-height:34px;padding:6px 10px"></div>
        <div class="suggest ${sug.kind === 'up' ? '' : sug.kind}">💡 ${h(sug.text)} <span class="faint tiny">Advisory only.</span></div></div>`;
    });
    out += `<div class="card"><div class="row"><select id="libPick" class="grow"><option value="">Add exercise…</option>${S.library.map((n) => `<option>${h(n)}</option>`).join('')}</select><button class="btn" data-a="sExAdd" data-s="${id}">Add</button></div><div class="row" style="margin-top:8px"><input type="text" id="libCustom" class="grow" placeholder="Custom exercise"><button class="btn" data-a="sExAdd" data-s="${id}" data-custom="1">Add</button></div></div>`;
    out += `<div class="card"><label class="f" style="margin-top:0">Session notes</label><textarea data-bind="sessions.${si}.notes" placeholder="Energy, sleep, technique…">${h(s.notes || '')}</textarea></div>`;
    out += `<div class="row"><button class="btn danger" data-a="delSession" data-s="${id}">Delete</button><a class="btn primary grow" href="#/training">Done</a></div><p class="tiny muted">Only sets ticked ✓ count toward your Workout ring and history. Tap a set number to mark it as a warm-up.</p>`;
    return out;
  }
  function tHistory() {
    const names = [...new Set(S.sessions.flatMap((s) => s.exercises.map((e) => e.name)))].sort();
    if (!names.length) return '<div class="card empty">Your lift history appears here after you log sessions.</div>';
    const sel = ui.histEx && names.includes(ui.histEx) ? ui.histEx : names[0];
    const hist = T.exerciseHistory(sel);
    let out = `<div class="card"><label class="f" style="margin-top:0">Exercise</label><select data-c="histEx">${names.map((n) => `<option ${n === sel ? 'selected' : ''}>${h(n)}</option>`).join('')}</select>`;
    if (hist.length) {
      const best = hist.reduce((m, x) => (x.best > m.best ? x : m), hist[0]);
      out += `<div class="grid2" style="margin:12px 0"><div class="kpi"><div class="v">${Math.max(...hist.map((x) => x.top))} kg</div><div class="l">Heaviest set</div></div><div class="kpi"><div class="v">${best.best ? best.best.toFixed(1) : '—'}</div><div class="l">Best est. 1RM</div><div class="tiny muted">${T.fmtDate(best.date)}</div></div></div>`;
      out += `<div class="small muted">Estimated 1-rep max (Epley) over time</div>` + lineChart(hist.map((x) => ({ x: T.fmtDate(x.date, { day: 'numeric', month: 'short' }), y: x.best ? +x.best.toFixed(1) : null })), { fmt: (v) => v + ' kg' });
      out += `<ul class="list" style="margin-top:10px">${[...hist].reverse().map((x) => `<li class="row between"><span class="small">${T.fmtDate(x.date)}</span><span class="small muted">${x.sets.map((q) => `${q.w}×${q.r}`).join(', ')}</span></li>`).join('')}</ul>`;
    } else out += '<div class="empty small">No completed sets yet for this exercise.</div>';
    return out + '</div>';
  }
  function tRuns() {
    const runs = [...S.runs].sort((a, b) => b.date.localeCompare(a.date));
    const ws = T.startOfWeek(T.today()), wk = S.runs.filter((r) => r.date >= ws);
    let out = `<div class="grid3" style="margin-bottom:14px"><div class="kpi"><div class="v">${wk.length}</div><div class="l">Runs this wk</div></div><div class="kpi"><div class="v">${wk.reduce((a, r) => a + (+r.min || 0), 0)}</div><div class="l">Minutes</div></div><div class="kpi"><div class="v">${T.round2(wk.reduce((a, r) => a + (+r.km || 0), 0))}</div><div class="l">km</div></div></div>`;
    out += `<button class="btn primary block" data-a="runSheet" data-d="${T.today()}" style="margin-bottom:14px">+ Log run</button>`;
    out += `<div class="card">${runs.length ? `<ul class="list">${runs.map((r) => `<li class="row between" data-a="runSheet" data-d="${r.date}" data-id="${r.id}" style="cursor:pointer"><div><div>${h(r.type)} · ${r.min} min${r.km ? ` · ${r.km} km` : ''}</div><div class="tiny muted">${T.fmtDate(r.date)}${r.km && r.min ? ' · ' + paceStr(r.min, r.km) + ' /km' : ''}${r.hr ? ` · ${r.hr} bpm` : ''}</div></div><span class="faint">›</span></li>`).join('')}</ul>` : '<div class="empty">No runs logged yet.</div>'}</div>`;
    return out;
  }
  function tBody() {
    const b = [...S.body].sort((a, c) => a.date.localeCompare(c.date));
    let out = `<div class="card"><h3>Add measurement</h3><form data-f="body"><div class="grid2"><div><label class="f">Date</label><input type="date" name="date" value="${T.today()}"></div><div><label class="f">Weight (kg)</label><input type="number" step="0.1" name="weight" inputmode="decimal"></div></div><div class="grid2"><div><label class="f">Waist (cm)</label><input type="number" step="0.1" name="waist"></div><div><label class="f">Body fat %</label><input type="number" step="0.1" name="bf"></div></div><label class="f">Body-fat method</label><select name="method"><option value="estimated">Estimated (scales, visual, calculator)</option><option value="measured">Measured (DEXA, calipers by pro)</option></select><button class="btn primary block" style="margin-top:12px">Save</button></form></div>`;
    out += `<div class="card"><h3>Weight trend</h3>${lineChart(b.filter((x) => x.weight).map((x) => ({ x: T.fmtDate(x.date, { day: 'numeric', month: 'short' }), y: x.weight })), { color: 'var(--diet)', fmt: (v) => v + ' kg' })}<p class="tiny muted">Body-fat aim from your diet plan: ${h(S.nutrition.targets.bodyFatAim)}. Trends over weeks matter more than single readings.</p></div>`;
    if (b.length) out += `<div class="card"><ul class="list">${[...b].reverse().map((x) => `<li class="row between"><div><div>${x.weight ? x.weight + ' kg' : ''}${x.waist ? ` · ${x.waist} cm waist` : ''}${x.bf ? ` · ${x.bf}% BF` : ''}</div><div class="tiny muted">${T.fmtDate(x.date)}${x.bf ? ` · BF ${x.method}` : ''}</div></div><button class="icon-btn" data-a="delBody" data-id="${x.id}">${icon.x}</button></li>`).join('')}</ul></div>`;
    return out;
  }

  /* ---------- NUTRITION ---------- */
  function vNutrition() {
    let out = top('Nutrition', { back: '#/more', eyebrow: 'Meal plan & log' });
    out += `<div class="seg" style="margin-bottom:14px">${[['day', 'Day'], ['meals', 'Meals'], ['plan', 'Plans'], ['shop', 'Shopping'], ['week', 'Week']].map(([k, l]) => `<button class="${ui.nutTab === k ? 'on' : ''}" data-a="nutTab" data-t="${k}">${l}</button>`).join('')}</div>`;
    return out + ({ day: nDay, meals: nMeals, plan: nPlan, shop: nShop, week: nWeek }[ui.nutTab])();
  }
  const handoffNote = () => !S.nutrition.meals.some((m) => m.kcal == null || m.src === 'handoff') ? '' : `<div class="notice">Figures marked from the handoff are the previous assistant's summary, not your workbook. Send me <b>Final Diet Dashboard 2027.xlsx</b> and I'll load exact recipes, weights and macros — or edit them under Meals.</div>`;
  function nDay() {
    const d = ui.nutDate || T.today(), dt = T.dayType(d), logs = T.mealLogs(d), n = T.dayNutrition(d), tg = S.nutrition.targets;
    let out = `<div class="row between" style="margin-bottom:10px"><button class="icon-btn" data-a="nutDay" data-n="-1">‹</button><div style="text-align:center"><div class="serif" style="font-size:19px">${T.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })}</div>${d === T.today() ? '<div class="tiny gold">Today</div>' : ''}</div><button class="icon-btn" data-a="nutDay" data-n="1">›</button></div>`;
    out += `<div class="seg" style="margin-bottom:12px"><button class="${dt === 'home' ? 'on' : ''}" data-a="dayType" data-d="${d}" data-v="home">Home day</button><button class="${dt === 'office' ? 'on' : ''}" data-a="dayType" data-d="${d}" data-v="office">Office day</button></div>`;
    out += `<div class="card"><div class="card-head"><h3>Planned meals</h3><span class="tiny muted">${(() => { const ms = T.mealsPlanned(d).map((x) => x.meal); if (!ms.length || ms.some((x) => !x || x.kcal == null)) return 'Plan total: add kcal to every meal'; const t = (k) => Math.round(ms.reduce((a, x) => a + (x[k] || 0), 0)); return `Plan: ${t('kcal').toLocaleString()} kcal · ${t('p')}P · ${t('c')}C · ${t('f')}F`; })()}</span></div><ul class="list">`;
    for (const m of T.mealsPlanned(d)) {
      const lg = logs.find((l) => l.planned && l.time === m.time);
      out += `<li><div class="meal-row"><span class="meal-time">${m.time}</span><div class="grow"><div>${h(lg ? T.meal(lg.mealId)?.name : m.meal?.name)}</div><div class="tiny muted">${(() => { const x = lg ? T.meal(lg.mealId) : m.meal; return x && x.kcal != null ? `${Math.round(x.kcal)} kcal · ${Math.round(x.p || 0)}g protein` : 'kcal not set'; })()}</div></div><button class="chk ${lg ? 'on' : ''}" data-a="toggleMeal" data-d="${d}" data-mid="${m.mealId}" data-time="${m.time}">${icon.check}</button></div>${lg ? `<div class="grid2" style="margin-top:8px"><select data-c="portion" data-d="${d}" data-id="${lg.id}">${[0.5, 0.75, 1, 1.25, 1.5].map((p) => `<option value="${p}" ${p === lg.portion ? 'selected' : ''}>Portion ×${p}</option>`).join('')}</select><select data-c="swap" data-d="${d}" data-id="${lg.id}">${S.nutrition.meals.map((x) => `<option value="${x.id}" ${x.id === lg.mealId ? 'selected' : ''}>${x.id === m.mealId ? 'As planned' : 'Swap: ' + h(x.name)}</option>`).join('')}</select></div>` : ''}</li>`;
    }
    for (const l of logs.filter((x) => !x.planned)) out += `<li class="meal-row"><span class="meal-time">${h(l.time || '')}</span><div class="grow">${h(l.name)}<div class="tiny muted">${l.kcal ?? '?'} kcal${l.portion !== 1 ? ' ×' + l.portion : ''}</div></div><button class="icon-btn" data-a="delFood" data-d="${d}" data-id="${l.id}">${icon.x}</button></li>`;
    out += `</ul><button class="btn block" style="margin-top:10px" data-a="foodSheet" data-d="${d}">+ Add other food</button></div>`;
    const bar = (v, t, col) => `<div class="bar"><i style="width:${t ? Math.min(100, (v / t) * 100) : 0}%;background:${col}"></i></div>`;
    out += `<div class="card"><h3>Consumed vs target</h3>${n.unknown ? `<p class="small warn">${n.unknown} logged meal(s) have no nutrition data yet, so totals are incomplete.</p>` : ''}
      <div class="stack" style="margin-top:8px">${[['Calories', n.kcal, tg.kcal, 'kcal', 'var(--gold)'], ['Protein', n.p, tg.p, 'g', 'var(--workout)'], ['Carbs', n.c, tg.c, 'g', 'var(--diet)'], ['Fat', n.f, tg.f, 'g', 'var(--reading)']].map(([l, v, t, u, c]) => `<div><div class="row between small"><span>${l}</span><span class="muted">${v.toLocaleString()} / ${t.toLocaleString()} ${u}</span></div>${bar(v, t, c)}</div>`).join('')}</div>
      <div class="row" style="margin-top:14px"><label class="small muted grow">Steps (target ${tg.steps.toLocaleString()})</label><input type="number" style="width:120px" value="${S.nutrition.steps[d] ?? ''}" data-bind="nutrition.steps.${d}" data-type="num"></div>
      <p class="tiny muted" style="margin-bottom:0">Planned and consumed are tracked separately. Eating less than planned lowers your Diet ring — under-eating is never rewarded.</p></div>`;
    return handoffNote() + out;
  }
  function nMeals() {
    let out = '';
    S.nutrition.meals.forEach((m, i) => {
      out += `<details class="card"><summary class="row between"><span style="color:var(--text);font-weight:600">${h(m.name)}</span><span class="small muted">${m.kcal ?? '?'} kcal</span></summary>
        <label class="f">Name</label><input type="text" value="${h(m.name)}" data-bind="nutrition.meals.${i}.name">
        <div class="grid2"><div><label class="f">kcal</label><input type="number" value="${m.kcal ?? ''}" data-bind="nutrition.meals.${i}.kcal" data-type="num"></div><div><label class="f">Protein g</label><input type="number" value="${m.p ?? ''}" data-bind="nutrition.meals.${i}.p" data-type="num"></div><div><label class="f">Carbs g</label><input type="number" value="${m.c ?? ''}" data-bind="nutrition.meals.${i}.c" data-type="num"></div><div><label class="f">Fat g</label><input type="number" value="${m.f ?? ''}" data-bind="nutrition.meals.${i}.f" data-type="num"></div></div>
        <label class="f">Ingredients (one per line, e.g. "80 g oats")</label><textarea data-bind="nutrition.meals.${i}.ingText">${h(m.ingText || (m.ingredients || []).join('\n'))}</textarea>
        <p class="tiny muted">Source: ${m.src === 'handoff' ? 'handoff summary (verify against workbook)' : m.src === 'workbook' ? 'your Meal Library workbook' : 'you'}</p></details>`;
    });
    return handoffNote() + out + `<button class="btn block" data-a="addMeal">+ New meal</button>`;
  }
  function nPlan() {
    let out = `<div class="card"><h3>Office days</h3><div class="row wrap" style="gap:6px;margin-top:8px">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button class="btn sm ${S.nutrition.officeDays.includes(w) ? 'primary' : ''}" data-a="officeDay" data-w="${w}">${WD[w]}</button>`).join('')}</div><p class="tiny muted">Other days use the Home plan. You can override any single date from the Day tab.</p></div>`;
    for (const key of ['home', 'office']) {
      const p = S.nutrition.plans[key];
      out += `<div class="card"><h3>${h(p.label)} plan</h3><ul class="list">${p.items.map((it, i) => `<li class="row"><input type="time" style="width:110px" value="${it.time}" data-bind="nutrition.plans.${key}.items.${i}.time" data-rerender><select class="grow" data-bind="nutrition.plans.${key}.items.${i}.mealId">${S.nutrition.meals.map((m) => `<option value="${m.id}" ${m.id === it.mealId ? 'selected' : ''}>${h(m.name)}</option>`).join('')}</select><button class="icon-btn" data-a="planDel" data-k="${key}" data-i="${i}">${icon.x}</button></li>`).join('')}</ul><button class="btn sm" data-a="planAdd" data-k="${key}">+ Meal slot</button></div>`;
    }
    out += `<div class="card"><h3>Daily targets</h3><div class="grid2">${[['kcal', 'Calories'], ['p', 'Protein g'], ['c', 'Carbs g'], ['f', 'Fat g'], ['steps', 'Steps']].map(([k, l]) => `<div><label class="f">${l}</label><input type="number" value="${S.nutrition.targets[k]}" data-bind="nutrition.targets.${k}" data-type="num"></div>`).join('')}</div><p class="tiny muted">From the handoff: avg ~3,197 kcal, 214 g P, 373 g C, 97 g F; eating window ${h(S.nutrition.targets.window)}. The chat noted ~3,200 kcal is roughly your historic maintenance — targets are never auto-adjusted; change them only from real weight trends.</p></div>`;
    return out;
  }
  function nShop() {
    const start = T.today(), counts = {};
    for (let i = 0; i < 7; i++) for (const m of T.mealsPlanned(T.addDays(start, i))) counts[m.mealId] = (counts[m.mealId] || 0) + 1;
    let out = `<div class="card"><h3>Next 7 days</h3><p class="small muted" style="margin-top:0">${T.fmtDate(start)} – ${T.fmtDate(T.addDays(start, 6))}. Multiply each recipe's ingredients by the count.</p><ul class="list">`;
    for (const [id, n] of Object.entries(counts)) {
      const m = T.meal(id); const ing = (m?.ingText || '').split('\n').filter((x) => x.trim());
      out += `<li><div class="row between"><strong>${h(m?.name)}</strong><span class="pill gold">×${n}</span></div>${ing.length ? `<ul class="small muted" style="margin:6px 0 0 18px;padding:0">${ing.map((x) => `<li>${h(x)}</li>`).join('')}</ul>` : '<div class="tiny faint">Add ingredients under Meals to build the full list.</div>'}</li>`;
    }
    return out + '</ul></div>';
  }
  function nWeek() {
    const days = T.range(T.addDays(T.today(), -6), T.today());
    const av = T.ringAverages(days);
    let out = `<div class="card"><h3>Last 7 days</h3><div class="kpi" style="margin:10px 0"><div class="v" style="color:var(--diet)">${pct(av.diet)}</div><div class="l">Diet adherence</div></div><ul class="list">`;
    for (const d of days) { const n = T.dayNutrition(d), r = T.dietRing(d); out += `<li class="row between"><span>${T.fmtDate(d)}</span><span class="small muted">${n.count} meals · ${n.kcal ? n.kcal.toLocaleString() + ' kcal' : '—'}${n.unknown ? '+' : ''} · <b style="color:var(--diet)">${pct(r.pct)}</b></span></li>`; }
    return out + '</ul></div>';
  }

  /* ---------- FINANCE ---------- */
  function vFinance() {
    let out = top('Finance', { back: '#/more', eyebrow: 'Cash flow' });
    out += `<div class="seg" style="margin-bottom:14px">${[['overview', 'Overview'], ['upcoming', 'Upcoming'], ['bills', 'Bills & income'], ['bank', 'Bank import'], ['setup', 'Balance'], ['ramsey', 'Ramsey']].map(([k, l]) => `<button class="${ui.finTab === k ? 'on' : ''}" data-a="finTab" data-t="${k}">${l}</button>`).join('')}</div>`;
    return out + ({ overview: fOverview, upcoming: fUpcoming, bills: fBills, setup: fSetup, ramsey: fRamsey, bank: fBank }[ui.finTab])();
  }
  function fOverview() {
    const d = T.today(), p = T.projectedBalance(d), ms = T.monthlySummary(), und = T.undated();
    let out = '';
    const todo = [];
    if (!S.finance.anchors.length) todo.push('Record your current bank balance (Balance tab), or import a Barclays statement (Bank import tab).');
    if (und.length) todo.push(`Add payment dates for ${und.length} item(s): ${und.map((x) => h(x.name)).join(', ')}.`);
    if (todo.length) out += `<div class="notice"><b>Before forecasts are reliable:</b><br>${todo.map((x) => '• ' + x).join('<br>')}<br><span class="tiny">I won't guess payday or bill dates — they need to come from you or the workbook.</span></div>`;
    if (p) {
      const series = T.forecastSeries(d, 60);
      const low = series.filter((x) => x.bal != null).reduce((m, x) => (x.bal < m.bal ? x : m), { bal: Infinity });
      out += `<div class="card"><div class="grid2"><div class="kpi"><div class="l">Projected today</div><div class="v">${T.gbp(p.balance)}</div></div><div class="kpi"><div class="l">In 30 days</div><div class="v">${T.gbp(series[30].bal)}</div></div></div><div style="margin-top:12px">${lineChart(series.map((x) => ({ x: T.fmtDate(x.date, { day: 'numeric', month: 'short' }), y: x.bal })), { fmt: (v) => '£' + Math.round(v), ref: S.settings.lowBalance })}</div><p class="small ${low.bal < S.settings.lowBalance ? 'warn' : 'muted'}">Lowest point next 60 days: <b>${T.gbp(low.bal)}</b> on ${T.fmtDate(low.date)}.</p><p class="tiny muted" style="margin-bottom:0">Projection = your last recorded bank balance (${T.gbp(p.anchor.amount)} on ${T.fmtDate(p.anchor.date)}) + scheduled income − scheduled bills − manual items after that date. Estimates, not real transactions.</p></div>`;
    }
    out += `<div class="card tight row between" data-a="finTab" data-t="ramsey" style="cursor:pointer"><div><div class="eyebrow">Ramsey plan</div><div>${S.finance.babyStep ? 'Baby Step ' + S.finance.babyStep + ': ' + h(window.TK_GAZETTE.BABY_STEPS[S.finance.babyStep - 1]) : '10 rules for money · set your Baby Step'}</div></div><span class="link">Open ›</span></div>`;
    out += `<div class="card"><h3>Monthly picture</h3><ul class="list">
      <li class="row between"><span>Take-home income</span><b>${T.gbp(ms.income)}</b></li>
      <li class="row between"><span>Monthly commitments</span><span>−${T.gbp(ms.monthlyBills)}</span></li>
      <li class="row between"><span>Remaining after commitments</span><b>${T.gbp(ms.afterBills)}</b></li>
      <li class="row between"><span>Weekly items, averaged (×52÷12)</span><span>−${T.gbp(ms.weeklyAvg)}</span></li>
      <li class="row between"><span>After everything listed</span><b class="gold">${T.gbp(ms.afterAll)}</b></li></ul>
      <p class="tiny muted" style="margin-bottom:0">${S.finance.items.filter((i) => i.freq === 'weekly').map((i) => `${h(i.name)} at ${T.gbp(i.amount)}/week averages ${T.gbp(i.amount * 52 / 12)}/month, but real months have 4 or 5 (${T.gbp(i.amount * 4)} or ${T.gbp(i.amount * 5)}) — the date forecast uses the actual weekly dates. `).join('')}"After everything" isn't necessarily spare money: unbudgeted variable costs (food, fuel, etc.) aren't here unless you add them.</p></div>`;
    return out;
  }
  function fRamsey() {
    const G = window.TK_GAZETTE, cur = S.finance.babyStep;
    const card = S.finance.items.find((i) => i.type === 'expense' && /card/i.test(i.name));
    let o = `<div class="card"><div class="eyebrow">Dave Ramsey</div><h2 style="margin:4px 0 6px">10 Rules for Money</h2><p class="small muted" style="margin:0">Ramsey has no single official "10 rules" list. These are the ten principles he teaches most consistently, summarised in our own words and built around his 7 Baby Steps. UK notes are our adaptation of a US plan.</p></div>`;
    o += `<div class="card"><h3>Which Baby Step are you on?</h3><p class="tiny muted" style="margin-top:0">Steps 1–3 are done one at a time, in order. Steps 4, 5 and 6 run together.</p><ul class="list">${G.BABY_STEPS.map((t, i) => `<li class="row" data-a="babyStep" data-n="${i + 1}" style="cursor:pointer"><span class="mod-num ${cur && i + 1 < cur ? 'done' : ''}" style="${cur === i + 1 ? 'background:var(--gold);color:#1a1406' : ''}">${cur && i + 1 < cur ? '✓' : i + 1}</span><div class="grow"><div style="${cur === i + 1 ? 'color:var(--gold2);font-weight:700' : ''}">${h(t)}</div>${cur === i + 1 ? '<div class="tiny gold">You are here</div>' : ''}</div></li>`).join('')}</ul>${cur === 2 && card ? `<p class="small" style="margin-bottom:0">Snowball target in your budget: <b>${h(card.name)}</b> (${T.gbp(card.amount)}/month currently).</p>` : ''}${!cur ? '<p class="tiny muted" style="margin-bottom:0">Tap a step to mark where you are.</p>' : ''}</div>`;
    o += `<div class="card"><ul class="list">${G.RAMSEY.map((r, i) => `<li><div class="row" style="align-items:flex-start"><span class="serif gold" style="font-size:26px;width:34px;flex:none;line-height:1">${i + 1}</span><div class="grow"><div style="font-weight:700">${h(r.t)}</div><div class="small" style="margin-top:3px;color:#d9d2c0">${h(r.d)}</div>${r.uk ? `<div class="tiny muted" style="margin-top:4px">🇬🇧 ${h(r.uk)}</div>` : ''}</div></div></li>`).join('')}</ul></div>`;
    o += `<p class="tiny muted">Source for the Baby Steps: ramseysolutions.com/dave-ramsey-7-baby-steps. This is general education, not personal financial advice.</p>`;
    return o;
  }
  function fBank() {
    const F = S.finance, bank = F.bank || [], last = (F.imports || []).slice(-1)[0];
    const mStart = T.today().slice(0, 7) + '-01';
    const month = bank.filter((r) => r.date >= mStart);
    const matchedIds = new Set(Object.values(F.overrides).map((o) => o.bankId).filter(Boolean));
    const outs = month.filter((r) => r.amount < 0), unplanned = outs.filter((r) => !matchedIds.has(r.id));
    const byType = {}; unplanned.forEach((r) => { const k = r.type || 'Other'; byType[k] = (byType[k] || 0) + -r.amount; });
    const byPayee = {}; unplanned.forEach((r) => { const k = (r.desc.split(/\s{1,}/).slice(0, 3).join(' ') || 'Unknown').toUpperCase(); byPayee[k] = (byPayee[k] || 0) + -r.amount; });
    let o = `<div class="card"><h3>Import a Barclays statement</h3><p class="small muted" style="margin-top:0">Your file is read here on your phone. Nothing is uploaded anywhere.</p>
      <label class="btn primary block" style="cursor:pointer">Choose CSV file<input type="file" accept=".csv,text/csv,text/comma-separated-values,application/vnd.ms-excel" data-c="bankFile" style="display:none"></label>
      <details style="margin-top:12px"><summary>How to get the file from Barclays</summary><ol class="small" style="padding-left:18px;margin:8px 0 0;color:#d9d2c0">
        <li>The Barclays <b>app</b> can't export CSV. Use <b>Online Banking</b> at barclays.co.uk. On iPhone, open it in Safari and tap <b>ᴀA → Request Desktop Website</b>.</li>
        <li>Sign in, then on your current account tap <b>Show recent transactions</b> → <b>View all transactions</b>.</li>
        <li>Pick a date range (e.g. the last 2–3 months) and tap <b>Search</b>.</li>
        <li>At the bottom tap <b>Export All</b> → choose <b>CSV</b>. It saves to your Files app (Downloads).</li>
        <li>Come back here, tap <b>Choose CSV file</b>, and pick it from Downloads.</li></ol></details>
      ${last ? `<p class="tiny muted" style="margin-bottom:0">Last import ${T.fmtDate(last.on)}: ${last.rows} transactions (${T.fmtDate(last.from)} – ${T.fmtDate(last.to)}), ${last.added} new, ${last.matched} matched to bills.</p>` : ''}</div>`;
    if (!bank.length) return o + `<p class="tiny muted">Tip: import every week or two, then record your balance. Forecasts restart from real numbers, bills are ticked off automatically, and your bill dates are learned from your statement.</p>`;
    o += `<div class="card"><h3>This month from your statement</h3><div class="grid2" style="margin-top:8px"><div class="kpi"><div class="l">Money out</div><div class="v">${T.gbp(outs.reduce((a, r) => a - r.amount, 0))}</div></div><div class="kpi"><div class="l">Not in your plan</div><div class="v warn">${T.gbp(unplanned.reduce((a, r) => a - r.amount, 0))}</div></div></div>
      ${Object.keys(byType).length ? `<div class="small muted" style="margin-top:12px">Unplanned spending by type</div><ul class="list">${Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `<li class="row between"><span>${h(k)}</span><b>${T.gbp(v)}</b></li>`).join('')}</ul>` : ''}
      ${Object.keys(byPayee).length ? `<div class="small muted" style="margin-top:8px">Top payees</div><ul class="list">${Object.entries(byPayee).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `<li class="row between"><span class="small">${h(k)}</span><span>${T.gbp(v)}</span></li>`).join('')}</ul>` : ''}
      <p class="tiny muted" style="margin-bottom:0">"Not in your plan" is anything that didn't match a bill in your Finance tab, such as food, fuel or shopping. Add regular ones as bills so forecasts include them.</p></div>`;
    o += `<div class="card"><h3>Recent transactions</h3><ul class="list">${[...bank].reverse().slice(0, 40).map((r) => `<li class="row between"><div class="grow" style="min-width:0"><div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h(r.desc || r.type)}</div><div class="tiny muted">${T.fmtDate(r.date)}${r.type ? ' · ' + h(r.type) : ''}${matchedIds.has(r.id) ? ' · <span class="good">✓ matched bill</span>' : ''}</div></div><div class="${r.amount > 0 ? 'good' : ''}" style="font-variant-numeric:tabular-nums">${r.amount > 0 ? '+' : ''}${T.gbp(r.amount)}</div></li>`).join('')}</ul>
      <button class="btn danger sm" style="margin-top:10px" data-a="clearBank">Remove imported transactions</button></div>`;
    return o;
  }
  function sheetImport() {
    const P = ui.importPreview; if (!P) return '';
    const { parsed, recon } = P;
    const ins = parsed.rows.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0), outs = parsed.rows.filter((r) => r.amount < 0).reduce((a, r) => a - r.amount, 0);
    return `<div class="row between"><h2>Review import</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div>
      <p class="small muted">${parsed.format} file · ${parsed.rows.length} transactions · ${T.fmtDate(parsed.from)} – ${T.fmtDate(parsed.to)}<br>In ${T.gbp(ins)} · Out ${T.gbp(outs)}</p>
      ${recon.suggestions.length ? `<h3 style="margin-top:14px">Learned from your statement</h3><p class="tiny muted" style="margin-top:0">These bills had no date set. Tick the ones that look right.</p><ul class="list">${recon.suggestions.map((g, i) => `<li><label class="row" style="align-items:flex-start"><input type="checkbox" checked data-sugg="${i}"><div><div><b>${h(g.name)}</b> → ${g.field === 'day' ? `monthly on the <b>${ordinal(g.value)}</b>` : `every <b>${WDL[g.value]}</b>`}</div><div class="tiny muted">${g.evidence.map(h).join('<br>')}</div></div></label></li>`).join('')}</ul>` : ''}
      <h3 style="margin-top:14px">Bills matched (${recon.matches.length})</h3>${recon.matches.length ? `<ul class="list">${recon.matches.map((m) => `<li class="row between"><span class="small">✓ ${h(m.name)} <span class="tiny muted">${T.fmtDate(m.date)}</span></span><span class="small">${T.gbp(m.amount)}${Math.abs(m.amount) !== Math.abs(m.expected) ? ` <span class="warn tiny">(expected ${T.gbp(Math.abs(m.expected))})</span>` : ''}</span></li>`).join('')}</ul>` : `<p class="tiny muted">${recon.suggestions.length ? 'More will match once the learned dates above are applied.' : 'None yet — set your bill dates (or accept the suggestions) and re-import.'}</p>`}
      <p class="small" style="margin-top:12px">${recon.unmatched.filter((r) => r.amount < 0).length} other payments (day-to-day spending) will be added to your Bank view.</p>
      <button class="btn primary block" data-a="confirmImport" style="margin-top:10px">Import</button>`;
  }
  const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  const statusPill = (s) => `<span class="pill ${s === 'paid' ? 'good' : s === 'confirmed' ? 'gold' : ''}">${s}</span>`;
  function fUpcoming() {
    const d = T.today(), occ = T.occurrences(d, T.addDays(d, 45));
    if (!occ.length) return `<div class="card empty">Nothing scheduled in the next 45 days. Add payment dates under <b>Bills & income</b>.</div>`;
    let out = `<div class="card"><p class="small muted" style="margin-top:0">Tap to change status, amount or date for a single occurrence. Expected → Confirmed → Paid.</p><ul class="list">`;
    let month = '';
    for (const o of occ) {
      const mm = o.date.slice(0, 7);
      if (mm !== month) { month = mm; out += `<li class="eyebrow" style="padding-top:14px">${T.toD(o.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</li>`; }
      const bal = T.projectedBalance(o.date);
      out += `<li class="row between" data-a="occSheet" data-k="${h(o.key)}" data-d="${o.date}" style="cursor:pointer"><div class="grow"><div>${h(o.name)}</div><div class="tiny muted">${T.fmtDate(o.date)} ${statusPill(o.status)}${bal ? ` · bal after day ≈ ${T.gbp(bal.balance)}` : ''}</div></div><div class="${o.amount > 0 ? 'good' : ''}" style="font-variant-numeric:tabular-nums">${o.amount > 0 ? '+' : ''}${T.gbp(o.amount)}</div></li>`;
    }
    return out + `</ul></div><button class="btn block" data-a="txnSheet">+ One-off income or spending</button>`;
  }
  function fBills() {
    const items = S.finance.items, per = (it) => (it.freq === 'monthly' || it.freq === 'lastweekday' ? 'mo' : it.freq === 'weekly' ? 'wk' : it.freq === 'yearly' ? 'yr' : 'once');
    const needsReview = items.filter((i) => /review|provisional/i.test(i.conf || '')).length;
    const placeholder = items.some((i) => i.src === 'handoff' || i.src === 'derived');
    let out = placeholder ? `<div class="notice">Some amounts below come from the handoff summary. Send me your budget workbook to load the exact lines and dates.</div>` : '';
    if (needsReview) out += `<div class="notice">${needsReview} item(s) are marked <b>Review</b> or <b>Provisional</b> in your budget: their dates vary. A Barclays statement import will show when they actually leave your account.</div>`;
    const row = (it) => `<li class="row between" data-a="itemSheet" data-id="${it.id}" style="cursor:pointer"><div class="grow" style="min-width:0"><div>${h(it.name)}${it.variable ? ' <span class="pill">allowance</span>' : ''}</div><div class="tiny ${whenStr(it) ? 'muted' : 'warn'}">${whenStr(it) || 'No date set — tap to add'}${it.payee ? ' · ' + h(it.payee) : ''}${it.conf && /review|provisional/i.test(it.conf) ? ` · <span class="warn">${h(it.conf.split('·')[0].trim())}</span>` : ''}</div></div><b style="font-variant-numeric:tabular-nums">${T.gbp(it.amount)}<span class="tiny muted">/${per(it)}</span></b></li>`;
    const inc = items.filter((i) => i.type === 'income');
    out += `<div class="card"><h3>Income</h3><ul class="list">${inc.map(row).join('')}</ul></div>`;
    const exp = items.filter((i) => i.type === 'expense');
    const cats = {}; for (const it of exp) (cats[it.category || 'Other'] = cats[it.category || 'Other'] || []).push(it);
    const monthly = (it) => (it.freq === 'weekly' ? it.amount * 52 / 12 : it.freq === 'yearly' ? it.amount / 12 : it.freq === 'once' ? 0 : it.amount);
    const order = Object.entries(cats).sort((x, y) => y[1].reduce((a, i) => a + monthly(i), 0) - x[1].reduce((a, i) => a + monthly(i), 0));
    for (const [cat, list] of order) {
      list.sort((x, y) => (x.day || 99) - (y.day || 99));
      out += `<div class="card"><div class="card-head"><h3>${h(cat)}</h3><span class="small muted">${T.gbp(list.reduce((a, i) => a + monthly(i), 0))}/mo</span></div><ul class="list">${list.map(row).join('')}</ul></div>`;
    }
    return out + `<button class="btn block" data-a="itemSheet" data-id="">+ Add income or bill</button>`;
  }
  const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  const whenStr = (it) => it.freq === 'lastweekday' ? (it.weekday != null ? `Last ${WDL[it.weekday]} of each month` : '') : it.freq === 'monthly' ? (it.day ? `Monthly on the ${ord(it.day)}` : '') : it.freq === 'weekly' ? (it.weekday != null ? `Every ${WDL[it.weekday]}` : '') : it.date ? (it.freq === 'yearly' ? 'Yearly on ' : 'On ') + T.fmtDate(it.date, { day: 'numeric', month: 'short', year: it.freq === 'once' ? 'numeric' : undefined }) : '';
  function fSetup() {
    const a = [...S.finance.anchors].sort((x, y) => y.date.localeCompare(x.date));
    return `<div class="card"><h3>Record actual bank balance</h3><p class="small muted" style="margin-top:0">Enter what your banking app shows. Forecasts restart from your latest figure — this is how you reconcile. No bank connection is made.</p><form data-f="anchor"><div class="grid2"><div><label class="f">Date</label><input type="date" name="date" value="${T.today()}"></div><div><label class="f">Balance (£)</label><input type="number" step="0.01" name="amount" inputmode="decimal" required></div></div><button class="btn primary block" style="margin-top:12px">Save balance</button></form><p class="tiny muted">Tip: after recording a balance, mark anything already taken from your account as <b>Paid</b> in Upcoming so it isn't counted twice.</p></div>
      ${a.length ? `<div class="card"><h3>Balance history</h3><ul class="list">${a.map((x) => `<li class="row between"><span>${T.fmtDate(x.date)}</span><span class="row"><b>${T.gbp(x.amount)}</b><button class="icon-btn" data-a="delAnchor" data-id="${x.id}">${icon.x}</button></span></li>`).join('')}</ul></div>` : ''}
      <div class="card"><h3>Low-balance alert</h3><div class="row"><span class="grow small muted">Warn me if a projection falls below</span><input type="number" style="width:110px" value="${S.settings.lowBalance}" data-bind="settings.lowBalance" data-type="num"></div></div>`;
  }
  function sheetItem(id) {
    const it = id ? S.finance.items.find((x) => x.id === id) : { name: '', type: 'expense', amount: '', freq: 'monthly' };
    return `<div class="row between"><h2>${id ? 'Edit' : 'New'} item</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><form data-f="item" data-id="${id || ''}">
      <label class="f">Name</label><input type="text" name="name" value="${h(it.name)}" required>
      <div class="grid2"><div><label class="f">Type</label><select name="type"><option value="expense" ${it.type === 'expense' ? 'selected' : ''}>Outgoing</option><option value="income" ${it.type === 'income' ? 'selected' : ''}>Income</option></select></div><div><label class="f">Amount (£)</label><input type="number" step="0.01" name="amount" value="${it.amount}" required></div></div>
      <label class="f">Frequency</label><select name="freq">${[['monthly', 'Monthly (day of month)'], ['lastweekday', 'Monthly (last weekday, e.g. last Thursday)'], ['weekly', 'Weekly'], ['yearly', 'Yearly'], ['once', 'One-off']].map(([v, l]) => `<option value="${v}" ${it.freq === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <div class="grid2"><div><label class="f">Day of month (monthly)</label><input type="number" min="1" max="31" name="day" value="${it.day ?? ''}"></div><div><label class="f">Weekday (weekly / last-weekday)</label><select name="weekday"><option value="">—</option>${WDL.map((w, i) => `<option value="${i}" ${+it.weekday === i && it.weekday != null ? 'selected' : ''}>${w}</option>`).join('')}</select></div></div>
      <label class="f">Date (yearly / one-off)</label><input type="date" name="date" value="${it.date || ''}">
      <label class="row" style="margin-top:12px"><input type="checkbox" name="variable" ${it.variable ? 'checked' : ''}> <span class="small">Variable amount</span></label>
      ${it.payee || it.category ? `<p class="tiny muted">${[it.payee && 'Payee: ' + h(it.payee), it.category && 'Category: ' + h(it.category), it.method && h(it.method)].filter(Boolean).join(' · ')}</p>` : ''}${it.conf ? `<p class="tiny ${/review|provisional/i.test(it.conf) ? 'warn' : 'muted'}">Date confidence: ${h(it.conf)}${it.seen ? ' — seen on ' + h(it.seen) : ''}</p>` : ''}${it.note ? `<p class="tiny warn">${h(it.note)}</p>` : ''}
      <p class="tiny muted">Months shorter than the chosen day use the last day of the month. Weekend/bank-holiday shifts aren't applied automatically — override a single occurrence in Upcoming.</p>
      <div class="row" style="margin-top:12px">${id ? `<button type="button" class="btn danger" data-a="delItem" data-id="${id}">Delete</button>` : ''}<button class="btn primary grow">Save</button></div></form>`;
  }
  function sheetOcc(key, date) {
    if (key.startsWith('txn|')) {
      const t = S.finance.txns.find((x) => x.id === key.slice(4));
      return sheetTxn(t);
    }
    const o = T.occurrences(T.addDays(date, -40), T.addDays(date, 40)).find((x) => x.key === key);
    if (!o) return '<div class="empty">Not found</div>';
    return `<div class="row between"><h2>${h(o.name)}</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><p class="small muted">Scheduled ${T.fmtDate(key.split('|')[1])}. Changes apply to this occurrence only.</p><form data-f="occ" data-k="${h(key)}">
      <div class="grid2"><div><label class="f">Date</label><input type="date" name="date" value="${o.date}"></div><div><label class="f">Amount (£)</label><input type="number" step="0.01" name="amount" value="${Math.abs(o.amount)}"></div></div>
      <label class="f">Status</label><div class="seg">${['expected', 'confirmed', 'paid'].map((s) => `<label style="flex:1"><input type="radio" name="status" value="${s}" ${o.status === s ? 'checked' : ''} style="display:none"><button type="button" class="${o.status === s ? 'on' : ''}" data-a="radioSeg" style="width:100%">${s[0].toUpperCase() + s.slice(1)}</button></label>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button type="button" class="btn ghost" data-a="occReset" data-k="${h(key)}">Reset</button><button class="btn primary grow">Save</button></div></form>`;
  }
  function sheetTxn(t) {
    t = t || { date: T.today(), desc: '', amount: '', status: 'expected' };
    const out = +t.amount < 0 || t.amount === '';
    return `<div class="row between"><h2>${t.id ? 'Edit' : 'New'} one-off</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><form data-f="txn" data-id="${t.id || ''}">
      <label class="f">Description</label><input type="text" name="desc" value="${h(t.desc)}" required>
      <div class="grid2"><div><label class="f">Date</label><input type="date" name="date" value="${t.date}"></div><div><label class="f">Amount (£)</label><input type="number" step="0.01" name="amount" value="${t.amount === '' ? '' : Math.abs(t.amount)}" required></div></div>
      <div class="grid2"><div><label class="f">Direction</label><select name="dir"><option value="out" ${out ? 'selected' : ''}>Money out</option><option value="in" ${!out ? 'selected' : ''}>Money in</option></select></div><div><label class="f">Status</label><select name="status">${['expected', 'confirmed', 'paid'].map((s) => `<option ${t.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <div class="row" style="margin-top:14px">${t.id ? `<button type="button" class="btn danger" data-a="delTxn" data-id="${t.id}">Delete</button>` : ''}<button class="btn primary grow">Save</button></div></form>`;
  }

  /* ---------- ACADEMY ---------- */
  function vAcademy() {
    let out = top('The Key Academy', { eyebrow: 'Five courses · twelve weeks each' });
    const wk = T.range(T.startOfWeek(T.today()), T.today()).reduce((a, d) => a + T.studyMinutes(d), 0);
    out += `<div class="grid2" style="margin-bottom:14px"><div class="kpi"><div class="v" style="color:var(--reading)">${wk}</div><div class="l">Minutes this week</div></div><a class="kpi" href="#/conversation" style="text-decoration:none;color:inherit"><div class="v gold serif">✦</div><div class="l">Great Conversation ›</div></a></div>`;
    for (const c of window.TK_COURSES) {
      const p = T.courseProgress(c.id);
      out += `<a class="card course-card" href="#/course/${c.id}"><span class="spine" style="background:${c.accent}"></span><div style="padding-left:6px"><div class="eyebrow" style="color:${c.accent}">${h(c.author)}</div><h2 style="margin:2px 0 6px">${h(c.title)}</h2><p class="small muted" style="margin:0 0 10px">${h(c.blurb)}</p><div class="bar"><i style="width:${Math.round(p.pct * 100)}%;background:${c.accent}"></i></div><div class="row between tiny muted" style="margin-top:6px"><span>${p.read}/12 readings · ${p.lect}/12 lectures</span><span>Mastery ${pct(p.mastery)}</span></div></div></a>`;
    }
    out += `<p class="tiny muted">Lectures are original study material written to accompany the books you own — not reproductions of the texts or of any other academy's lectures. Video links marked ✓ were checked to exist on ${'21 Nov 2026'}; others are YouTube searches you can replace with your own picks.</p>`;
    return out;
  }
  function vCourse(cid) {
    const c = T.course(cid); if (!c) return top('Not found', { back: '#/academy' });
    const p = T.courseProgress(cid);
    let out = top(h(c.title), { back: '#/academy', eyebrow: c.author });
    out += `<div class="card"><p class="small" style="margin-top:0">${h(c.blurb)}</p><div class="grid3"><div class="kpi"><div class="v">${p.read}</div><div class="l">Readings</div></div><div class="kpi"><div class="v">${p.lect}</div><div class="l">Lectures</div></div><div class="kpi"><div class="v">${pct(p.mastery)}</div><div class="l">Mastery</div></div></div>
      <label class="f">Your edition / translation</label><input type="text" placeholder="e.g. Penguin Classics, trans. Robin Buss" value="${h(S.study.editions[cid] || '')}" data-bind="study.editions.${cid}">
      <p class="tiny ${cid === 'bible' ? 'warn' : 'muted'}">${h(c.edition)}</p></div>`;
    out += `<div class="card"><h3>Modules</h3>${c.weeks.map((w, i) => {
      const pr = S.study.progress[T.modKey(cid, i)] || {}, ok = T.unlocked(cid, i);
      return `<a class="mod-row" href="#/module/${cid}/${i}"><span class="mod-num ${pr.read && pr.lecture ? 'done' : ''}">${pr.read && pr.lecture ? '✓' : i + 1}</span><div class="grow"><div style="font-weight:600">${ok ? h(w.t) : 'Week ' + (i + 1) + ' · locked'}</div><div class="tiny muted">${h(w.r)}${!ok ? ' · spoiler guard' : ''}</div></div><span class="faint">›</span></a>`;
    }).join('')}</div>`;
    return out;
  }
  function vModule(cid, i) {
    i = +i; const c = T.course(cid); const w = c?.weeks[i]; if (!w) return top('Not found', { back: '#/academy' });
    const k = T.modKey(cid, i), pr = S.study.progress[k] || {}, ok = T.unlocked(cid, i);
    let out = top(h(w.t), { back: '#/course/' + cid, eyebrow: `${c.title} · Week ${i + 1}` });
    out += `<div class="card"><div class="eyebrow">Reading assignment</div><div class="serif" style="font-size:20px;margin:4px 0">${h(w.r)}</div><div class="tiny muted">${S.study.editions[cid] ? 'Your edition: ' + h(S.study.editions[cid]) : 'Set your edition on the course page'}</div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm ${pr.read ? 'primary' : ''}" data-a="modFlag" data-k="${k}" data-f="read">${pr.read ? '✓ Read' : 'Mark read'}</button><button class="btn sm ${pr.lecture ? 'primary' : ''}" data-a="modFlag" data-k="${k}" data-f="lecture" ${ok ? '' : 'disabled'}>${pr.lecture ? '✓ Lecture done' : 'Lecture done'}</button><button class="btn sm" data-a="studySheet" data-d="${T.today()}" data-c="${cid}">+ Log time</button></div></div>`;
    if (!ok) {
      return out + `<div class="card locked"><div class="faint">${icon.lock}</div><h3 style="margin:8px 0">Spoiler guard</h3><p class="small muted">This lecture discusses events from ${h(w.r)}. Mark last week's reading as done to unlock it, or reveal it anyway.</p><button class="btn" data-a="modFlag" data-k="${k}" data-f="revealed">Reveal anyway</button></div>`;
    }
    out += `<div class="card"><div class="eyebrow">Lecture</div><div class="lecture" style="margin-top:10px">${w.l.split('\n\n').map((p) => `<p>${h(p)}</p>`).join('')}</div>${i > 0 && c.weeks[0].l.length > w.l.length * 2 ? '<p class="tiny faint">Phase-1 lecture: concise. Full-length lectures are authored progressively, once your edition is confirmed.</p>' : ''}<div class="row wrap" style="gap:6px">${(w.themes || []).map((t) => `<a class="pill gold" href="#/conversation" data-a="setTheme" data-t="${t}" style="text-decoration:none">✦ ${t}</a>`).join('')}</div></div>`;
    // videos
    const mine = S.study.videos[k] || [];
    out += `<div class="card"><div class="eyebrow">Watch</div><div style="margin-top:10px">${[...w.v, ...mine.map((m) => ({ ...m, mine: true }))].map((v, vi) => `<div class="video"><div class="row between" style="align-items:flex-start"><div class="grow"><div style="font-weight:600">${h(v.title)}</div><div class="tiny muted">${v.channel ? h(v.channel) + ' · ' : ''}${v.verified ? '<span class="good">✓ link checked</span>' : v.mine ? 'added by you' : '<span class="warn">search — not a vetted pick</span>'}</div></div>${v.mine ? `<button class="icon-btn" data-a="delVideo" data-k="${k}" data-i="${vi - w.v.length}">${icon.x}</button>` : ''}</div>${v.why ? `<div class="small" style="margin-top:6px">${h(v.why)}</div>` : ''}${v.ask ? `<div class="small gold" style="margin-top:4px">Viewing question: ${h(v.ask)}</div>` : ''}<a class="btn sm" style="margin-top:8px" href="${h(v.url)}" target="_blank" rel="noopener">Open ↗</a></div>`).join('')}</div>
      <details><summary>+ Add a video you found</summary><form data-f="video" data-k="${k}"><label class="f">Title</label><input type="text" name="title" required><label class="f">URL</label><input type="url" name="url" required placeholder="https://www.youtube.com/watch?v=…"><label class="f">Why it matters</label><input type="text" name="why"><button class="btn block" style="margin-top:10px">Save video</button></form></details></div>`;
    // discussion
    const ans = S.study.answers[k] || {};
    out += `<div class="card"><div class="eyebrow">Socratic discussion</div>${w.q.map((q, qi) => `<label class="f" style="color:var(--text);font-size:15px;margin-top:14px">${qi + 1}. ${h(q)}</label><textarea data-bind="study.answers.${k}.q${qi}" placeholder="Think it through in writing…">${h(ans['q' + qi] || '')}</textarea>`).join('')}
      <button class="btn block" style="margin-top:12px" data-a="tutorPrompt" data-c="${cid}" data-i="${i}">Copy AI tutor prompt</button><p class="tiny muted">Copies a spoiler-safe Socratic tutor prompt (including your answers) to paste into Claude. A built-in tutor needs a secure backend — see the README.</p></div>`;
    // quiz
    if (w.quiz) {
      const qs = S.study.quiz[k] || { picks: {} };
      out += `<div class="card"><div class="card-head"><div class="eyebrow">Check your understanding</div>${qs.total ? `<span class="pill gold">${qs.score}/${qs.total}</span>` : ''}</div>${w.quiz.map((q, qi) => {
        const pick = qs.picks?.[qi];
        return `<div style="margin-top:12px"><div style="font-weight:600">${qi + 1}. ${h(q.q)}</div>${q.o.map((o, oi) => `<button class="quiz-opt ${pick != null ? (oi === q.a ? 'right' : oi === pick ? 'wrong' : '') : ''}" data-a="quizPick" data-k="${k}" data-c="${cid}" data-i="${i}" data-q="${qi}" data-o="${oi}" ${pick != null ? 'disabled' : ''}>${h(o)}</button>`).join('')}${pick != null ? `<div class="small muted">${h(q.why)}</div>` : ''}</div>`;
      }).join('')}${qs.total ? `<button class="btn sm ghost" style="margin-top:10px" data-a="quizReset" data-k="${k}">Retake</button>` : ''}</div>`;
    }
    out += `<div class="card"><div class="eyebrow">Reflection & notes</div><textarea style="margin-top:10px;min-height:140px" data-bind="study.notes.${k}" placeholder="Key ideas, quotes (short), how this connects to your life and the other books…">${h(S.study.notes[k] || '')}</textarea></div>`;
    out += `<div class="row">${i > 0 ? `<a class="btn grow" href="#/module/${cid}/${i - 1}">‹ Week ${i}</a>` : ''}${i < 11 ? `<a class="btn grow" href="#/module/${cid}/${i + 1}">Week ${i + 2} ›</a>` : ''}</div>`;
    return out;
  }
  function vConversation() {
    let out = top('The Great Conversation', { back: '#/academy', eyebrow: 'Across your courses' });
    out += `<p class="small muted">Follow one idea through every book you're studying. Only modules you've unlocked appear, so fiction stays spoiler-free.</p><div class="row wrap" style="gap:6px;margin-bottom:14px">${window.TK_THEMES.map((t) => `<button class="btn sm ${ui.theme === t ? 'primary' : ''}" data-a="setTheme" data-t="${t}">${t}</button>`).join('')}</div>`;
    let any = false;
    for (const c of window.TK_COURSES) {
      const mods = c.weeks.map((w, i) => ({ w, i })).filter(({ w, i }) => (w.themes || []).includes(ui.theme) && T.unlocked(c.id, i));
      if (!mods.length) continue; any = true;
      out += `<div class="card"><div class="eyebrow" style="color:${c.accent}">${h(c.title)}</div><ul class="list">${mods.map(({ w, i }) => { const a = S.study.answers[T.modKey(c.id, i)] || {}; const first = Object.values(a).find((x) => x && x.trim()); return `<li><a href="#/module/${c.id}/${i}" style="text-decoration:none;color:inherit"><div style="font-weight:600">Wk ${i + 1} · ${h(w.t)}</div><div class="tiny muted">${h(w.r)}</div>${first ? `<div class="small" style="margin-top:4px;font-style:italic">"${h(first.slice(0, 140))}${first.length > 140 ? '…' : ''}"</div>` : ''}</a></li>`; }).join('')}</ul></div>`;
    }
    if (!any) out += '<div class="card empty">No unlocked modules on this theme yet.</div>';
    return out;
  }
  function tutorPrompt(cid, i) {
    const c = T.course(cid), w = c.weeks[i], k = T.modKey(cid, i), a = S.study.answers[k] || {};
    const readTo = c.weeks.map((_, j) => (S.study.progress[T.modKey(cid, j)] || {}).read ? j : -1).filter((j) => j >= 0).pop();
    return `You are a rigorous, warm Socratic tutor for a university-level course on "${c.title}" by ${c.author}.
Module: Week ${i + 1} — ${w.t}. Assigned reading: ${w.r}. Edition: ${S.study.editions[cid] || 'not specified'}.
${c.fiction ? `SPOILER BOUNDARY: I have read up to and including "${readTo != null ? c.weeks[readTo].r : 'nothing yet'}". Do not reveal or hint at anything after that point.` : ''}
Do not reproduce long passages of the text. Ask me one probing question at a time, challenge weak reasoning, offer serious counterarguments, and only explain once I've attempted an answer.
Discussion questions and my current answers:
${w.q.map((q, qi) => `${qi + 1}. ${q}\n   My answer: ${(a['q' + qi] || '(not answered yet)').trim()}`).join('\n')}
Start by asking about whichever of my answers is weakest.`;
  }

  /* ---------- LOCK-IN ---------- */
  function vLockin() {
    const ci = T.cycleInfo();
    let out = top('Lock-in', { back: '#/more', eyebrow: ci ? `${T.fmtDate(ci.start, { day: 'numeric', month: 'long' })} – ${T.fmtDate(ci.end, { day: 'numeric', month: 'long', year: 'numeric' })}` : '' });
    out += `<div class="card"><p class="serif" style="font-size:18px;margin-top:0">Twelve weeks, fully locked in.</p>${((S.personal && S.personal.lockin) || []).map((x) => `<div class="lock-item"><div class="row between"><h3 style="margin:0">${h(x.k)}</h3><span class="pill gold">${h(x.d)}</span></div><p class="small" style="margin:8px 0 0;color:#d9d2c0">${h(x.body)}</p></div>`).join('')}</div>`;
    if (!((S.personal && S.personal.lockin) || []).length) out += `<div class="notice">No commitments loaded. Unlock your personal setup in Settings to see your lock-in.</div>`;
    out += `<p class="tiny muted">This is your reference, not a checklist. Daily tracking happens through the three rings. Work and career goals are deliberately kept out of The Key.</p>`;
    return out;
  }

  /* ---------- PROGRESS ---------- */
  function vProgress() {
    const ws = ui.progWeek || T.startOfWeek(T.today()), we = T.addDays(ws, 6), days = T.range(ws, we);
    const prev = T.range(T.addDays(ws, -7), T.addDays(ws, -1));
    const av = T.ringAverages(days), pv = T.ringAverages(prev);
    let out = top('Progress', { back: '#/more', eyebrow: 'Weekly review' });
    out += `<div class="row between" style="margin-bottom:12px"><button class="icon-btn" data-a="progMove" data-n="-7">‹</button><div class="serif" style="font-size:18px">${T.fmtDate(ws, { day: 'numeric', month: 'short' })} – ${T.fmtDate(we, { day: 'numeric', month: 'short' })}</div><button class="icon-btn" data-a="progMove" data-n="7">›</button></div>`;
    out += `<div class="card"><h3>Rings</h3><div class="grid3" style="margin-top:10px">${['workout', 'diet', 'reading'].map((k) => { const dlt = av[k] != null && pv[k] != null ? Math.round((av[k] - pv[k]) * 100) : null; return `<div class="kpi"><div class="v" style="color:var(--${k})">${pct(av[k])}</div><div class="l">${RING[k]}</div><div class="tiny ${dlt > 0 ? 'good' : dlt < 0 ? 'warn' : 'muted'}">${dlt == null ? '' : (dlt > 0 ? '▲ ' : dlt < 0 ? '▼ ' : '') + Math.abs(dlt) + ' pts vs last wk'}</div></div>`; }).join('')}</div><div class="row" style="justify-content:space-between;margin-top:12px">${days.map((d) => `<div style="text-align:center" data-a="openDay" data-d="${d}">${ringSVG(T.rings(d), 38, 9)}<div class="tiny faint">${WD[T.weekday(d)][0]}</div></div>`).join('')}</div></div>`;
    const sess = S.sessions.filter((s) => s.date >= ws && s.date <= we), runs = S.runs.filter((r) => r.date >= ws && r.date <= we);
    out += `<div class="card"><h3>Training</h3><div class="grid3" style="margin-top:10px"><div class="kpi"><div class="v">${sess.length}</div><div class="l">Sessions</div></div><div class="kpi"><div class="v">${sess.reduce((a, s) => a + T.workSets(s).length, 0)}</div><div class="l">Work sets</div></div><div class="kpi"><div class="v">${Math.round(sess.reduce((a, s) => a + volume(s), 0) / 1000 * 10) / 10}t</div><div class="l">Volume</div></div><div class="kpi"><div class="v">${runs.length}</div><div class="l">Runs</div></div><div class="kpi"><div class="v">${runs.reduce((a, r) => a + (+r.min || 0), 0)}</div><div class="l">Run min</div></div><div class="kpi"><div class="v">${T.round2(runs.reduce((a, r) => a + (+r.km || 0), 0))}</div><div class="l">km</div></div></div>${legSets(sess)}</div>`;
    const meals = days.reduce((a, d) => a + T.mealLogs(d).length, 0), planned = days.filter((d) => d <= T.today()).reduce((a, d) => a + T.mealsPlanned(d).length, 0);
    const kc = days.map((d) => T.dayNutrition(d)).filter((n) => n.count && !n.unknown);
    out += `<div class="card"><h3>Nutrition</h3><div class="grid2" style="margin-top:10px"><div class="kpi"><div class="v">${meals}/${planned}</div><div class="l">Meals logged</div></div><div class="kpi"><div class="v">${kc.length ? Math.round(kc.reduce((a, n) => a + n.kcal, 0) / kc.length).toLocaleString() : '—'}</div><div class="l">Avg kcal (complete days)</div></div></div></div>`;
    const sm = days.reduce((a, d) => a + T.studyMinutes(d), 0);
    out += `<div class="card"><h3>Study</h3><div class="grid2" style="margin-top:10px"><div class="kpi"><div class="v">${sm}</div><div class="l">Minutes</div></div><div class="kpi"><div class="v">${Math.round(sm / 60 * 10) / 10}h</div><div class="l">Hours</div></div></div></div>`;
    const bw = [...S.body].filter((x) => x.weight).sort((a, b) => a.date.localeCompare(b.date));
    if (bw.length >= 2) out += `<div class="card"><h3>Bodyweight</h3>${lineChart(bw.map((x) => ({ x: T.fmtDate(x.date, { day: 'numeric', month: 'short' }), y: x.weight })), { color: 'var(--diet)', fmt: (v) => v + ' kg' })}</div>`;
    // cycle heat strip
    const ci = T.cycleInfo();
    if (ci) {
      const cd = T.range(ci.start, ci.end);
      out += `<div class="card"><h3>${h(ci.name)}</h3><p class="tiny muted" style="margin-top:0">Each square is one day. Brighter = more complete. Hatched = rest.</p>${['workout', 'diet', 'reading'].map((k) => `<div class="row" style="gap:2px;margin-top:6px;flex-wrap:wrap">${cd.map((d) => { const r = T.rings(d)[k]; const op = r.state === 'future' ? 0.05 : r.state === 'rest' ? 0.25 : 0.12 + 0.88 * r.pct; return `<span title="${d}" style="width:7px;height:12px;border-radius:2px;background:var(--${k});opacity:${op};${r.state === 'rest' ? 'background-image:repeating-linear-gradient(45deg,transparent 0 2px,#000 2px 3px)' : ''}"></span>`; }).join('')}</div>`).join('')}</div>`;
    }
    out += `<div class="card"><div class="card-head"><h3>The Key Cycles</h3><button class="link" data-a="cycleSheet">+ New cycle</button></div><ul class="list">${S.cycles.map((c) => `<li class="row between" data-a="cycleSheet" data-id="${c.id}" style="cursor:pointer"><span>${h(c.name)} <span class="tiny gold">Edit</span></span><span class="small muted">${T.fmtDate(c.start, { day: 'numeric', month: 'short', year: '2-digit' })} – ${T.fmtDate(c.end, { day: 'numeric', month: 'short', year: '2-digit' })}</span></li>`).join('')}</ul><p class="tiny muted">New cycles keep all history. Rings and trends here show patterns, not proof of cause and effect.</p></div>`;
    return out;
  }
  function legSets(sess) {
    const re = /squat|lunge|leg|calf|hip thrust|deadlift|step-up|split|good morning|swing|hamstring/i, core = /plank|crunch|ab |ab wheel|leg raise|pallof|dead bug|core|carry|hang/i;
    let l = 0, c = 0; for (const s of sess) for (const e of s.exercises) { const n = e.sets.filter((x) => x.done && !x.warmup).length; if (re.test(e.name)) l += n; if (core.test(e.name)) c += n; }
    return `<p class="small muted" style="margin-bottom:0">Priority focus this cycle — <b style="color:var(--text)">${l}</b> leg sets · <b style="color:var(--text)">${c}</b> core sets this week (matched by exercise name).</p>`;
  }

  /* ---------- DISCOVER: THE KEY GAZETTE ---------- */
  const DX = window.TK_DISCOVER, GZ = window.TK_GAZETTE;
  function srng(seed) { let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const allArticles = () => [...GZ.articles, ...((S.personal && S.personal.articles) || [])];
  const gzById = (id) => allArticles().find((a) => a.id === id);
  function quoteOfDay(date) {
    const qs = S.myQuotes || []; if (!qs.length) return null;
    // each quote gets a fixed pseudo-random slot, so adding one doesn't reshuffle the rest
    const keyed = qs.map((q) => ({ q, k: srng('q' + q.id)() })).sort((a, b) => a.k - b.k).map((x) => x.q);
    return keyed[Math.abs(T.diffDays('2026-01-01', date)) % keyed.length];
  }
  function themeAff() { const a = {}; for (const id of Object.keys(S.discover.likes)) { const it = gzById(id) || DX.byId(id); for (const t of it?.themes || []) a[t] = (a[t] || 0) + 1; } return a; }
  const artVisible = (a) => !a.req || a.req.every(([c, w]) => T.unlocked(c, w));
  function pickArticles(pool, n, r, aff, exclude = []) {
    const D = S.discover;
    return pool.filter((a) => artVisible(a) && !D.hidden[a.id] && !exclude.includes(a.id))
      .map((a) => ({ a, s: r() * 1.6 - (D.seen[a.id] || 0) * 2.2 + (a.themes || []).reduce((x, t) => x + (aff[t] || 0) * 0.3, 0) }))
      .sort((x, y) => y.s - x.s).slice(0, n).map((x) => x.a.id);
  }
  function edition(date) {
    const D = S.discover; D.editions = D.editions || {};
    if (D.editions[date]) return D.editions[date];
    const r = srng('ed' + date), aff = themeAff(), A = allArticles();
    const lead = pickArticles(A.filter((a) => a.sec === 'lead'), 1, r, aff)[0] || pickArticles(A.filter((a) => a.sec === 'scripture'), 1, r, aff)[0];
    const scripture = pickArticles(A.filter((a) => a.sec === 'scripture'), 1, r, aff, [lead])[0];
    const convo = pickArticles(A.filter((a) => a.sec === 'convo'), 1, r, aff)[0] || pickArticles(A.filter((a) => a.sec === 'lead'), 1, r, aff, [lead])[0];
    const craft = pickArticles(A.filter((a) => a.sec === 'craft'), 1, r, aff)[0];
    const deck = DX.dailyDeck(S, T, date).map(DX.byId).filter(Boolean);
    const vis = DX.cards.filter((k) => DX.visible(k, T) && !D.hidden[k.id]);
    const first = (f) => (deck.find(f) || vis.find(f))?.id || null;
    const briefs = [...deck.filter((k) => k.type === 'idea' || k.type === 'fact'), ...vis.filter((k) => k.type === 'idea' || k.type === 'fact')].map((k) => k.id).filter((id, i, arr) => arr.indexOf(id) === i).slice(0, 4);
    const E = { lead, scripture, convo, craft, briefs, word: first((k) => k.type === 'word'), margin: first((k) => k.type === 'quote' && k.c === 'bible') || first((k) => k.type === 'quote'), question: first((k) => k.type === 'question') };
    D.editions[date] = E;
    // count what was printed as "seen" so tomorrow's paper brings fresh pieces
    for (const id of [lead, scripture, convo, craft, ...briefs, E.word, E.margin, E.question].filter(Boolean)) D.seen[id] = (D.seen[id] || 0) + 1;
    // keep the archive small
    const keys = Object.keys(D.editions).sort(); while (keys.length > 120) delete D.editions[keys.shift()];
    save();
    return E;
  }
  const paras = (arr, drop) => arr.map((p, i) => `<p class="${drop && i === 0 ? 'dropcap' : ''}">${h(p)}</p>`).join('');
  function acts(id) {
    const D = S.discover;
    return `<div class="gz-acts"><button data-a="dLike" data-id="${id}" class="${D.likes[id] ? 'on' : ''}">${D.likes[id] ? '♥ Liked' : '♡ Like'}</button><button data-a="dSave" data-id="${id}" class="${D.saved[id] ? 'on' : ''}">✂ ${D.saved[id] ? 'Clipped' : 'Clip'}</button><button data-a="dHide" data-id="${id}">Less like this</button></div>`;
  }
  function articleHTML(a, { big = false, kicker = '' } = {}) {
    if (!a) return '';
    return `<article class="gz-art ${big ? 'lead' : ''}">${kicker ? `<div class="gz-kicker">${kicker}</div>` : ''}<h2 class="gz-head">${h(a.head)}</h2>${a.deck ? `<div class="gz-deck">${h(a.deck)}</div>` : ''}${big && a.art ? `<figure class="gz-fig">${DX.art(a.art, a.id)}<figcaption>Engraving for The McKenna Gazette</figcaption></figure>` : ''}<div class="gz-body">${paras(a.body, big)}</div>${a.refs ? `<div class="gz-refs">${h(a.refs)}</div>` : ''}${acts(a.id)}</article>`;
  }
  function vDiscover() {
    if (ui.dFilter === 'clips') return vClippings();
    const td = T.today(), date = ui.gDate && ui.gDate <= td ? ui.gDate : td, E = edition(date), ci = T.cycleInfo(date);
    const q = quoteOfDay(date), D = S.discover;
    const minDate = S.cycles[0].start;
    const dateLine = T.toD(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
    const no = Math.max(1, T.diffDays(minDate, date) + 1);
    const word = DX.byId(E.word), margin = DX.byId(E.margin), qn = DX.byId(E.question);
    let o = `<div class="paper">`;
    o += `<div class="gz-nav"><button data-a="gzDay" data-n="-1" ${date <= minDate ? 'disabled' : ''}>‹ Earlier</button><button data-a="dFilter" data-f="clips">✂ Clippings${Object.keys(D.saved).length ? ' (' + Object.keys(D.saved).length + ')' : ''}</button><button data-a="gzDay" data-n="1" ${date >= td ? 'disabled' : ''}>Later ›</button></div>`;
    o += `<div class="gz-top"><span>Vol. I · No. ${no}</span><span>London</span><span>Price: one hour of focus</span></div>`;
    o += `<h1 class="gz-mast">The McKenna Gazette</h1><div class="gz-motto">“Unlock Your Potential” · Printed for one reader</div>`;
    o += `<div class="gz-dateline"><span>${dateLine}</span>${ci && ci.active ? `<span>Cycle day ${ci.day} of ${ci.total}</span>` : ''}</div>`;
    if (date !== td) o += `<div class="gz-back">Back issue · <button class="link" data-a="gzToday">return to today's edition</button></div>`;
    if (q) o += `<section class="gz-qotd"><div class="gz-label">Quote of the Day</div><blockquote>${h(q.text)}</blockquote>${q.by ? `<cite>— ${h(q.by)}</cite>` : ''}<div class="gz-orn">❦</div></section>`;
    o += articleHTML(gzById(E.lead), { big: true, kicker: 'The Leading Article' });
    o += `<div class="gz-rule"></div><div class="gz-cols"><div>${articleHTML(gzById(E.scripture), { kicker: 'From the Scriptures' })}</div><div class="gz-side">`;
    if (word) o += `<section class="gz-box"><div class="gz-label">Word of the Day</div><div class="gz-word">${h(word.word)}</div><div class="gz-translit">${h(word.translit)} — <i>${h(word.title)}</i></div><p>${h(word.text)}</p></section>`;
    if (margin) o += `<section class="gz-box"><div class="gz-label">In the Margin</div><p class="gz-mq">“${h(margin.text)}”</p><div class="gz-refs">${h(margin.by)}</div></section>`;
    o += `</div></div><div class="gz-rule"></div>`;
    const cv = gzById(E.convo);
    o += articleHTML(cv, { kicker: cv && cv.sec === 'convo' ? 'The Great Conversation' : 'Further Reflection' });
    if (E.briefs.length) {
      o += `<div class="gz-rule"></div><div class="gz-kicker center">Dispatches from the Academy</div><div class="gz-briefs">${E.briefs.map(DX.byId).filter(Boolean).map((k) => `<div class="gz-brief"><h3>${h(k.title)}</h3><p>${h(k.text)}</p><a href="${k.c === 'life' ? '#/lockin' : `#/module/${k.c}/${k.w || 0}`}">— ${h(k.c === 'life' ? 'The Key' : T.course(k.c).title)}${k.c !== 'life' ? ', Wk ' + ((k.w || 0) + 1) : ''}</a></div>`).join('')}</div>`;
    }
    o += `<div class="gz-rule"></div>` + articleHTML(gzById(E.craft), { kicker: 'Discipline & Craft' });
    if (qn) o += `<section class="gz-box gz-q"><div class="gz-label">A Question for the Evening</div><h3>${h(qn.title)}</h3><p>${h(qn.text)}</p><textarea placeholder="Write your answer — kept privately" data-bind="discover.reflections.${qn.id}">${h(D.reflections[qn.id] || '')}</textarea></section>`;
    const nm = nextModule();
    o += `<div class="gz-end"><div class="gz-orn">✦ ✦ ✦</div><p>${date === td ? 'That is today\'s edition. Tomorrow\'s goes to press at midnight.' : 'End of this back issue.'}</p>${nm && date === td ? `<a class="gz-btn" href="#/module/${nm.c.id}/${nm.i}">Now, to the books: ${h(nm.c.title)}, week ${nm.i + 1} ›</a>` : ''}<button class="link gz-small" data-a="quotesSheet">Edit your quotes (${(S.myQuotes || []).length})</button></div>`;
    o += `</div>`;
    return o;
  }
  function vClippings() {
    const D = S.discover, ids = Object.keys(D.saved).sort((a, b) => (D.saved[b] || '').localeCompare(D.saved[a] || ''));
    let o = `<div class="paper"><div class="gz-nav"><button data-a="dFilter" data-f="paper">‹ Today's paper</button><span></span><span></span></div><h1 class="gz-mast small">Clippings</h1><div class="gz-motto">Pieces you cut out and kept</div><div class="gz-rule"></div>`;
    if (!ids.length) o += `<p class="gz-empty">Nothing clipped yet. Tap ✂ Clip on any article to keep it here.</p>`;
    for (const id of ids) {
      const a = gzById(id), k = DX.byId(id);
      if (a) o += `<div class="gz-clip">${articleHTML(a)}<div class="gz-refs">Clipped ${T.fmtDate(D.saved[id])}</div></div>`;
      else if (k) o += `<div class="gz-clip"><article class="gz-art">${k.title ? `<h2 class="gz-head">${h(k.title)}</h2>` : ''}<div class="gz-body"><p>${h(k.text)}</p></div>${k.by ? `<div class="gz-refs">${h(k.by)}</div>` : ''}${acts(id)}</article></div>`;
    }
    return o + '</div>';
  }
  function sheetQuotes() {
    const qs = S.myQuotes || [];
    return `<div class="row between"><h2>Your quotes</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><p class="small muted">One appears each day as the Quote of the Day, rotating through all of them.</p>
      <ul class="list">${qs.map((q, i) => `<li><textarea style="min-height:70px" data-bind="myQuotes.${i}.text">${h(q.text)}</textarea><div class="row" style="margin-top:6px"><input type="text" placeholder="Attribution (optional)" value="${h(q.by || '')}" data-bind="myQuotes.${i}.by" class="grow"><button class="icon-btn" data-a="delQuote" data-id="${q.id}">${icon.x}</button></div></li>`).join('')}</ul>
      <form data-f="quote"><label class="f">Add a quote</label><textarea name="text" required></textarea><input type="text" name="by" placeholder="Attribution (optional)" style="margin-top:8px"><button class="btn primary block" style="margin-top:10px">Add quote</button></form>`;
  }

  function sheetCycle(id) {
    const c = id ? S.cycles.find((x) => x.id === id) : null;
    const last = S.cycles[S.cycles.length - 1];
    const start = c ? c.start : T.addDays(last.end, 1), end = c ? c.end : T.addDays(start, 83);
    const len = T.diffDays(start, end) + 1;
    return `<div class="row between"><h2>${c ? 'Edit cycle' : 'New cycle'}</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div>
      <form data-f="cycle" data-id="${c ? c.id : ''}"><label class="f">Name</label><input type="text" name="name" value="${h(c ? c.name : 'Cycle ' + (S.cycles.length + 1))}" required>
      <div class="grid2"><div><label class="f">Start date</label><input type="date" name="start" id="cyStart" value="${start}" required></div><div><label class="f">End date</label><input type="date" name="end" id="cyEnd" value="${end}" required></div></div>
      <label class="f">Quick length</label><div class="row wrap" style="gap:6px">${[4, 8, 12, 16].map((w) => `<button type="button" class="btn sm" data-a="cycleWeeks" data-w="${w}">${w} weeks</button>`).join('')}</div>
      <p class="small muted" id="cyInfo">${len} days${c && T.today() >= c.start && T.today() <= c.end ? ` · today is day ${T.diffDays(c.start, T.today()) + 1}` : ''}</p>
      <p class="tiny muted">Changing dates only changes how days are counted. Your logged workouts, meals and study stay exactly as they are.</p>
      <div class="row" style="margin-top:12px">${c ? `<button type="button" class="btn danger" data-a="delCycle" data-id="${c.id}">Delete</button>` : ''}<button class="btn primary grow">Save</button></div></form>`;
  }
  /* ---------- MORE / SETTINGS ---------- */
  function vMore() {
    const tiles = [['#/nutrition', '🍽', 'Nutrition', 'Meal plan, log & shopping'], ['#/finance', '💷', 'Finance', 'Bills, payday & forecast'], ['#/lockin', '🗝', 'Lock-in', 'Your commitments'], ['#/progress', '📈', 'Progress', 'Weekly review & cycles'], ['#/discover', '📰', 'The McKenna Gazette', 'Your daily paper'], ['#/conversation', '✦', 'Great Conversation', 'Themes across books'], ['#/settings', '⚙️', 'Settings', 'Backup, reminders, install']];
    return top('More', { eyebrow: 'The Key' }) + `<div class="grid2">${tiles.map(([href, e, t, s]) => `<a class="card" href="${href}" style="text-decoration:none;color:inherit;margin:0"><div style="font-size:26px">${e}</div><div style="font-weight:700;margin-top:6px">${t}</div><div class="tiny muted">${s}</div></a>`).join('')}</div>`;
  }
  function vSettings() {
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    return top('Settings', { back: '#/more', eyebrow: 'The Key' }) + `
      <div class="card"><h3>Ring goals</h3><div class="grid2"><div><label class="f">Daily study (min)</label><input type="number" value="${S.settings.readingGoalMin}" data-bind="settings.readingGoalMin" data-type="num"></div><div><label class="f">Default run (min)</label><input type="number" value="${S.settings.runDefaultMin}" data-bind="settings.runDefaultMin" data-type="num"></div></div><label class="f">Rest-day bonus activity that fills the ring (min)</label><input type="number" value="${S.settings.restDayActivityMin}" data-bind="settings.restDayActivityMin" data-type="num"><p class="tiny muted">Workout ring: gym days = ticked working sets ÷ planned sets; run days = minutes ÷ target; rest and optional days never count against you. Diet ring = planned meals eaten (portion-weighted). Reading ring = study minutes ÷ goal.</p></div>
      <div class="card"><h3>Reminders</h3><p class="small muted" style="margin-top:0"><b>Most reliable:</b> add The Key's schedule to your phone's calendar. Your calendar app then alerts you even when The Key is closed.</p><div class="stack"><button class="btn block" data-a="ics" data-w="all">Download calendar (.ics): bills, meals & training</button><div class="grid3"><button class="btn sm" data-a="ics" data-w="bills">Bills only</button><button class="btn sm" data-a="ics" data-w="meals">Meals only</button><button class="btn sm" data-a="ics" data-w="training">Training only</button></div></div>
        <hr class="sep"><div class="row between"><div class="grow"><div style="font-weight:600">In-app notifications</div><div class="tiny muted">Meal times & bills due tomorrow. Only fire while The Key is open or recently used (permission: ${perm}).</div></div><button class="btn sm" data-a="notif">${S.settings.notifications && perm === 'granted' ? 'On' : 'Enable'}</button></div><p class="tiny muted">iPhone: notifications need iOS 16.4+ and The Key added to your Home Screen. True background push needs a server — planned for a later version.</p></div>
      <div class="card"><h3>Install on your phone</h3>${standalone ? '<p class="good small">✓ Running as an installed app.</p>' : `<p class="small" style="margin-top:0"><b>iPhone (Safari):</b> Share button → <i>Add to Home Screen</i>.<br><b>Android (Chrome):</b> ⋮ menu → <i>Install app</i> / <i>Add to Home screen</i>.</p>`}<p class="tiny muted">Requires The Key to be served over HTTPS (see README for a free 2-minute deploy).</p></div>
      <div class="card"><h3>Personal setup</h3><p class="small muted" style="margin-top:0">${S.settings.unlocked ? `Unlocked on ${T.fmtDate(S.settings.unlocked)}. Your edits since then live only on this device — keep backups.` : 'Your routine, meal plan, bills, lock-in and quotes are stored encrypted on the site. Unlock them with your passphrase.'}</p><button class="btn block" data-a="startUnlock">${S.settings.unlocked ? 'Re-load setup from encrypted file' : 'Unlock personal setup'}</button></div>
      <div class="card"><h3>Your data</h3><p class="small muted" style="margin-top:0">Everything is stored privately on this device only — nothing is sent anywhere. Back up regularly, and use the backup file to move to a new phone.</p><div class="stack"><button class="btn block" data-a="exportData">Export backup (.json)</button><label class="btn block ghost" style="cursor:pointer">Import backup<input type="file" accept="application/json,.json" data-c="importData" style="display:none"></label><button class="btn danger block" data-a="wipe">Delete all data</button></div></div>
      <p class="tiny muted" style="text-align:center">The Key · v1.7 · local-first · ${h(S.settings.tagline)}</p>`;
  }

  /* ---------- UNLOCK ---------- */
  function vUnlock() {
    const replacing = !FIRST_RUN || (S.sessions.length + S.runs.length + S.study.log.length) > 0;
    return `<div class="unlock"><div class="unlock-key">${icon.key.replace('width="26" height="26"', 'width="84" height="84"')}</div><h1>The Key</h1><p class="muted">Unlock Your Potential</p>
      <form data-f="unlock" class="unlock-form" autocomplete="off"><label class="f" for="pp">Passphrase</label><input id="pp" name="pass" type="password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="five words, separated by spaces" required>
      <label class="row small muted" style="margin-top:8px"><input type="checkbox" data-a="togglePass"> Show passphrase</label>
      <div id="unlockErr" class="small bad" style="min-height:20px;margin-top:8px"></div>
      <button class="btn primary block">Unlock my setup</button></form>
      <p class="tiny muted" style="margin-top:14px">Your routine, meal plan, bills, lock-in and quotes are stored on this site encrypted. They are decrypted here, on this device, and saved privately on it. The passphrase never leaves your phone.${replacing ? ' <b>Unlocking replaces the data currently on this device</b> — export a backup first if needed.' : ''}</p>
      <button class="link" style="margin-top:6px" data-a="skipUnlock">${FIRST_RUN ? 'Start with a blank app instead' : 'Cancel'}</button></div>`;
  }

  /* ================= ROUTER ================= */
  function route() { const p = (location.hash || '#/home').slice(2).split('/'); return { name: p[0] || 'home', args: p.slice(1) }; }
  function render() {
    S = T.S;
    const r = route();
    const map = { home: vHome, calendar: vCalendar, training: vTraining, academy: vAcademy, more: vMore, nutrition: vNutrition, finance: vFinance, lockin: vLockin, progress: vProgress, settings: vSettings, session: () => vSession(r.args[0]), template: () => vTemplate(r.args[0]), course: () => vCourse(r.args[0]), module: () => vModule(r.args[0], r.args[1]), conversation: vConversation, discover: vDiscover };
    const tabOf = { session: 'training', template: 'training', course: 'academy', module: 'academy', conversation: 'academy', nutrition: 'more', finance: 'more', lockin: 'more', progress: 'more', settings: 'more' };
    document.body.classList.toggle('locked', !!ui.unlock);
    if (ui.unlock) { $app.innerHTML = vUnlock(); renderSheet(); return; }
    const y = window.scrollY, same = render.last === location.hash;
    $app.innerHTML = (map[r.name] || vHome)();
    render.last = location.hash;
    if (!same) window.scrollTo(0, 0); else window.scrollTo(0, y);
    document.querySelectorAll('nav.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (tabOf[r.name] || r.name)));
    renderSheet();
  }
  function renderSheet() {
    if (!ui.sheet) { $ov.innerHTML = ''; return; }
    const sc = $ov.querySelector('.sheet')?.scrollTop || 0;
    $ov.innerHTML = `<div class="sheet-back" data-a="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${ui.sheet()}</div>`;
    $ov.querySelector('.sheet').scrollTop = sc;
  }
  const openSheet = (fn) => { ui.sheet = fn; renderSheet(); };
  const closeSheet = () => { ui.sheet = null; renderSheet(); };
  const refresh = () => { save(); render(); };

  /* ================= ACTIONS ================= */
  function newSession(templateId, date) {
    const t = templateId ? T.tpl(templateId) : null;
    const s = { id: T.uid(), date: date || T.today(), templateId: templateId || null, name: t ? t.name : 'Session', created: Date.now(), min: null, notes: '',
      exercises: (t ? t.exercises : []).map((e) => {
        const hist = T.exerciseHistory(e.name); const last = hist[hist.length - 1];
        const base = last ? last.sets : e.sets;
        return { name: e.name, note: e.note || '', sets: base.map((x, i) => ({ w: x.w, r: x.r, rpe: null, done: false, warmup: !!(e.sets[i] && e.sets[i].warmup) })) };
      }) };
    S.sessions.push(s); save(); return s;
  }
  const A = {
    back: (el) => { if (history.length > 1) history.back(); else location.hash = el.dataset.to; },
    openDay: (el) => { const d = el.dataset.d; openSheet(() => sheetDay(d)); },
    closeSheet: (el) => { closeSheet(); if (el.dataset.nav) location.hash = el.dataset.nav; },
    calMove: (el) => { let [y, m] = ui.calMonth.split('-').map(Number); m += +el.dataset.n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ui.calMonth = `${y}-${String(m).padStart(2, '0')}`; ui.weekStart = `${ui.calMonth}-01`; render(); },
    calView: (el) => { ui.calView = el.dataset.v; render(); },
    calToday: () => { ui.calMonth = T.today().slice(0, 7); ui.weekStart = null; render(); },
    weekMove: (el) => { ui.weekStart = T.addDays(T.startOfWeek(ui.weekStart || T.today()), +el.dataset.n); ui.calMonth = ui.weekStart.slice(0, 7); render(); },
    dayStatus: (el) => { const d = el.dataset.d; if (el.dataset.v) S.dayStatus[d] = el.dataset.v; else delete S.dayStatus[d]; refresh(); },
    toggleMeal: (el) => {
      const { d, mid, time } = el.dataset; const logs = (S.nutrition.logs[d] = S.nutrition.logs[d] || []);
      const i = logs.findIndex((l) => l.planned && l.time === time);
      if (i >= 0) logs.splice(i, 1); else logs.push({ id: T.uid(), mealId: mid, name: T.meal(mid)?.name, portion: 1, planned: true, time });
      refresh();
    },
    delFood: (el) => { const logs = S.nutrition.logs[el.dataset.d] || []; const i = logs.findIndex((l) => l.id === el.dataset.id); if (i >= 0) logs.splice(i, 1); refresh(); },
    foodSheet: (el) => { const d = el.dataset.d; openSheet(() => sheetFood(d)); },
    runSheet: (el) => { const { d, id } = el.dataset; openSheet(() => sheetRun(d, id)); },
    delRun: (el) => { if (!confirm('Delete this run?')) return; S.runs = S.runs.filter((r) => r.id !== el.dataset.id); closeSheet(); refresh(); },
    studySheet: (el) => { const { d, c } = el.dataset; openSheet(() => sheetStudy(d, c)); },
    delStudy: (el) => { S.study.log = S.study.log.filter((x) => x.id !== el.dataset.id); refresh(); },
    pickSession: (el) => { const d = el.dataset.d; openSheet(() => sheetPickSession(d)); },
    startSession: (el) => { const s = newSession(el.dataset.id, el.dataset.d); ui.sheet = null; location.hash = '#/session/' + s.id; },
    goSession: (el) => { location.hash = '#/session/' + el.dataset.id; },
    trainTab: (el) => { ui.trainTab = el.dataset.t; if (!location.hash.startsWith('#/training')) location.hash = '#/training'; else render(); },
    setDone: (el) => { const s = S.sessions.find((x) => x.id === el.dataset.s); const x = s.exercises[el.dataset.e].sets[el.dataset.x]; x.done = !x.done; if (x.done && navigator.vibrate) navigator.vibrate(15); refresh(); },
    setWarm: (el) => { const s = S.sessions.find((x) => x.id === el.dataset.s); const x = s.exercises[el.dataset.e].sets[el.dataset.x]; x.warmup = !x.warmup; refresh(); },
    setAdd: (el) => { const s = S.sessions.find((x) => x.id === el.dataset.s); const e = s.exercises[el.dataset.e]; const l = e.sets[e.sets.length - 1] || {}; e.sets.push({ w: l.w ?? null, r: l.r ?? null, rpe: null, done: false, warmup: false }); refresh(); },
    setDel: (el) => { const s = S.sessions.find((x) => x.id === el.dataset.s); s.exercises[el.dataset.e].sets.pop(); refresh(); },
    sExDel: (el) => { if (!confirm('Remove this exercise from the session?')) return; const s = S.sessions.find((x) => x.id === el.dataset.s); s.exercises.splice(+el.dataset.e, 1); refresh(); },
    sExAdd: (el) => { const name = (el.dataset.custom ? document.getElementById('libCustom').value : document.getElementById('libPick').value).trim(); if (!name) return; addToLibrary(name); const s = S.sessions.find((x) => x.id === el.dataset.s); s.exercises.push({ name, sets: [{ w: null, r: null, done: false }] }); refresh(); },
    delSession: (el) => { if (!confirm('Delete this session?')) return; S.sessions = S.sessions.filter((x) => x.id !== el.dataset.s); save(); location.hash = '#/training'; },
    timer: (el) => startTimer(+el.dataset.s),
    addTemplate: () => { const name = prompt('Template name (e.g. Upper, Core finisher)'); if (!name) return; const id = T.uid(); S.templates.push({ id, name, exercises: [] }); save(); location.hash = '#/template/' + id; },
    delTemplate: (el) => { if (!confirm('Delete this template? Logged sessions are kept.')) return; S.templates = S.templates.filter((t) => t.id !== el.dataset.t); for (const w in S.schedule) if (S.schedule[w].templateId === el.dataset.t) S.schedule[w] = { type: 'rest' }; save(); location.hash = '#/training'; },
    exAdd: (el) => { const name = (el.dataset.custom ? document.getElementById('libCustom').value : document.getElementById('libPick').value).trim(); if (!name) return; addToLibrary(name); T.tpl(el.dataset.t).exercises.push({ id: T.uid(), name, repLow: 8, repHigh: 12, inc: 2.5, sets: [{ w: null, r: 10 }, { w: null, r: 10 }, { w: null, r: 10 }] }); refresh(); },
    exDel: (el) => { if (!confirm('Remove exercise from template?')) return; T.tpl(el.dataset.t).exercises.splice(+el.dataset.i, 1); refresh(); },
    exMove: (el) => { const ex = T.tpl(el.dataset.t).exercises, i = +el.dataset.i, j = i + +el.dataset.n; if (j < 0 || j >= ex.length) return; [ex[i], ex[j]] = [ex[j], ex[i]]; refresh(); },
    tsetAdd: (el) => { const v = prompt('Baseline set as kg×reps (e.g. 60x10)'); if (!v) return; const m = v.replace(/\s/g, '').match(/^(\d+(?:\.\d+)?)[x×*](\d+)$/i); if (!m) return toast('Use the format 60x10'); T.tpl(el.dataset.t).exercises[el.dataset.i].sets.push({ w: +m[1], r: +m[2] }); refresh(); },
    tsetDel: (el) => { T.tpl(el.dataset.t).exercises[el.dataset.i].sets.splice(+el.dataset.s, 1); refresh(); },
    delBody: (el) => { S.body = S.body.filter((x) => x.id !== el.dataset.id); refresh(); },
    nutTab: (el) => { ui.nutTab = el.dataset.t; render(); },
    nutDay: (el) => { ui.nutDate = T.addDays(ui.nutDate || T.today(), +el.dataset.n); render(); },
    dayType: (el) => { const d = el.dataset.d; const def = S.nutrition.officeDays.includes(T.weekday(d)) ? 'office' : 'home'; if (el.dataset.v === def) delete S.nutrition.dayTypeOverride[d]; else S.nutrition.dayTypeOverride[d] = el.dataset.v; refresh(); },
    addMeal: () => { const name = prompt('Meal name'); if (!name) return; S.nutrition.meals.push({ id: T.uid(), name, kcal: null, p: null, c: null, f: null, ingText: '', src: 'you' }); refresh(); },
    officeDay: (el) => { const w = +el.dataset.w, o = S.nutrition.officeDays; const i = o.indexOf(w); if (i >= 0) o.splice(i, 1); else o.push(w); refresh(); },
    planAdd: (el) => { S.nutrition.plans[el.dataset.k].items.push({ mealId: S.nutrition.meals[0].id, time: '12:00' }); refresh(); },
    planDel: (el) => { S.nutrition.plans[el.dataset.k].items.splice(+el.dataset.i, 1); refresh(); },
    finTab: (el) => { ui.finTab = el.dataset.t; if (!location.hash.startsWith('#/finance')) location.hash = '#/finance'; else render(); },
    itemSheet: (el) => { const id = el.dataset.id; openSheet(() => sheetItem(id)); },
    delItem: (el) => { if (!confirm('Delete this item?')) return; S.finance.items = S.finance.items.filter((x) => x.id !== el.dataset.id); closeSheet(); refresh(); },
    occSheet: (el) => { const { k, d } = el.dataset; openSheet(() => sheetOcc(k, d)); },
    occReset: (el) => { delete S.finance.overrides[el.dataset.k]; closeSheet(); refresh(); },
    radioSeg: (el) => { const lab = el.closest('label'); lab.querySelector('input').checked = true; lab.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); },
    txnSheet: () => openSheet(() => sheetTxn(null)),
    delTxn: (el) => { S.finance.txns = S.finance.txns.filter((x) => x.id !== el.dataset.id); closeSheet(); refresh(); },
    delAnchor: (el) => { if (!confirm('Delete this balance record?')) return; S.finance.anchors = S.finance.anchors.filter((x) => x.id !== el.dataset.id); refresh(); },
    modFlag: (el) => { const k = el.dataset.k, f = el.dataset.f; const p = (S.study.progress[k] = S.study.progress[k] || {}); p[f] = !p[f]; if (p[f] && f !== 'revealed') p[f + 'On'] = T.today(); refresh(); },
    quizPick: (el) => { const k = el.dataset.k, w = T.course(el.dataset.c).weeks[+el.dataset.i]; const q = (S.study.quiz[k] = S.study.quiz[k] || { picks: {} }); q.picks[el.dataset.q] = +el.dataset.o; const picks = Object.entries(q.picks); if (picks.length === w.quiz.length) { q.total = w.quiz.length; q.score = picks.filter(([qi, o]) => w.quiz[qi].a === o).length; q.on = T.today(); } refresh(); },
    quizReset: (el) => { delete S.study.quiz[el.dataset.k]; refresh(); },
    delVideo: (el) => { S.study.videos[el.dataset.k].splice(+el.dataset.i, 1); refresh(); },
    setTheme: (el) => { ui.theme = el.dataset.t; if (location.hash !== '#/conversation') location.hash = '#/conversation'; else render(); },
    tutorPrompt: async (el) => { const txt = tutorPrompt(el.dataset.c, +el.dataset.i); try { await navigator.clipboard.writeText(txt); toast('Tutor prompt copied — paste it into Claude'); } catch (e) { openSheet(() => `<h2>Tutor prompt</h2><textarea style="min-height:300px">${h(txt)}</textarea><button class="btn block" data-a="closeSheet">Close</button>`); } },
    progMove: (el) => { ui.progWeek = T.addDays(ui.progWeek || T.startOfWeek(T.today()), +el.dataset.n); render(); },
    cycleSheet: (el) => { const id = el && el.dataset ? el.dataset.id : null; openSheet(() => sheetCycle(id)); },
    delCycle: (el) => { if (S.cycles.length < 2) return toast('You need at least one cycle'); if (!confirm('Delete this cycle? Your logged data is kept.')) return; S.cycles = S.cycles.filter((c) => c.id !== el.dataset.id); closeSheet(); refresh(); },
    ics: (el) => { const w = el.dataset.w; const o = w === 'all' ? {} : { bills: w === 'bills', meals: w === 'meals', training: w === 'training' }; T.download(`the-key-${w}.ics`, T.buildICS(o), 'text/calendar'); toast('Open the file to add it to your calendar'); },
    notif: async () => {
      if (!('Notification' in window)) return toast('Notifications aren\'t supported here. Use the calendar export.');
      const p = await Notification.requestPermission(); S.settings.notifications = p === 'granted'; refresh();
      toast(p === 'granted' ? 'In-app reminders on' : 'Permission not granted');
    },
    dFilter: (el) => { ui.dFilter = el.dataset.f; window.scrollTo(0, 0); render(); },
    gzDay: (el) => { const td = T.today(); let d = T.addDays(ui.gDate && ui.gDate <= td ? ui.gDate : td, +el.dataset.n); if (d > td) d = td; ui.gDate = d; render.last = null; render(); },
    gzToday: () => { ui.gDate = null; render.last = null; render(); },
    dLike: (el) => { const D = S.discover, id = el.dataset.id; if (D.likes[id]) delete D.likes[id]; else D.likes[id] = T.today(); refresh(); },
    dSave: (el) => { const D = S.discover, id = el.dataset.id; if (D.saved[id]) delete D.saved[id]; else D.saved[id] = T.today(); refresh(); toast(D.saved[id] ? 'Clipped — find it under ✂ Clippings' : 'Removed from Clippings'); },
    dHide: (el) => { const id = el.dataset.id; S.discover.hidden[id] = T.today(); delete S.discover.likes[id]; save(); toast("Noted — you'll see less like this in future editions"); },
    quotesSheet: () => openSheet(sheetQuotes),
    delQuote: (el) => { if (!confirm('Delete this quote?')) return; S.myQuotes = S.myQuotes.filter((q) => q.id !== el.dataset.id); refresh(); },
    babyStep: (el) => { S.finance.babyStep = +el.dataset.n === S.finance.babyStep ? null : +el.dataset.n; refresh(); },
    confirmImport: () => {
      const P = ui.importPreview; if (!P) return;
      const accepted = [...document.querySelectorAll('[data-sugg]')].filter((c) => c.checked).map((c) => P.recon.suggestions[+c.dataset.sugg]);
      const res = T.applyImport(P.parsed, P.recon, accepted); ui.importPreview = null;
      openSheet(() => `<div class="row between"><h2>Imported</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><p>${res.added} new transactions added, ${res.matched} bills marked paid${accepted.length ? `, ${accepted.length} bill dates learned` : ''}.</p><h3>Now record today's balance</h3><p class="small muted" style="margin-top:0">Open the Barclays app and type in the balance it shows. Your forecast restarts from this real figure.</p><form data-f="anchor"><input type="hidden" name="date" value="${T.today()}"><input type="number" step="0.01" name="amount" inputmode="decimal" placeholder="Balance in £" required><button class="btn primary block" style="margin-top:10px">Save balance</button></form><button class="link" style="margin-top:12px" data-a="closeSheet">Skip for now</button>`);
      refresh();
    },
    clearBank: () => { if (!confirm('Remove all imported bank transactions from this device? Bills already marked paid stay paid.')) return; S.finance.bank = []; for (const k in S.finance.overrides) delete S.finance.overrides[k].bankId; refresh(); },
    cycleWeeks: (el) => { const st = document.getElementById('cyStart').value; if (!st) return; const en = T.addDays(st, +el.dataset.w * 7 - 1); document.getElementById('cyEnd').value = en; document.getElementById('cyInfo').textContent = (T.diffDays(st, en) + 1) + ' days'; },
    updateSheet: () => openSheet(() => `<div class="row between"><h2>Apply setup update</h2><button class="icon-btn" data-a="closeSheet">${icon.x}</button></div><p class="small">${h(ui.update?.note || '')}</p><p class="small muted">This merges the new data into your app. Your logged workouts, meals, study, money and edits all stay.</p><form data-f="applyUpdate"><label class="f">Passphrase</label><input type="password" name="pass" id="pp" autocapitalize="none" autocorrect="off" spellcheck="false" required><div id="unlockErr" class="small bad" style="min-height:20px;margin-top:8px"></div><button class="btn primary block">Apply update</button></form>`),
    togglePass: (el) => { const i = document.getElementById('pp'); if (i) i.type = i.type === 'password' ? 'text' : 'password'; },
    skipUnlock: () => { ui.unlock = false; S.settings.unlockSkipped = true; save(); render(); },
    startUnlock: () => { ui.unlock = true; render(); },
    exportData: () => { T.download(`the-key-backup-${T.today()}.json`, JSON.stringify(S, null, 2)); toast('Backup downloaded'); },
    wipe: () => { const v = prompt('This permanently deletes all your data on this device. Type DELETE to confirm.'); if (v === 'DELETE') { T.resetAll(); S = T.S; location.hash = '#/home'; render(); toast('All data deleted'); } },
  };
  function addToLibrary(name) { if (!S.library.some((n) => n.toLowerCase() === name.toLowerCase())) S.library.push(name); }

  /* ---------- forms ---------- */
  const F = {
    run: (f, d) => { const r = { id: f.dataset.id || T.uid(), date: d.date, type: d.type, min: T.num(d.min), km: T.num(d.km), hr: T.num(d.hr), zone: d.zone, note: d.note }; const i = S.runs.findIndex((x) => x.id === r.id); if (i >= 0) S.runs[i] = r; else S.runs.push(r); closeSheet(); refresh(); toast('Run saved'); },
    study: (f, d) => { S.study.log.push({ id: T.uid(), date: d.date, course: d.course, kind: d.kind, min: T.num(d.min) || 0, pages: T.num(d.pages), note: d.note }); closeSheet(); refresh(); toast('Study logged'); },
    food: (f, d) => { const day = f.dataset.d; const m = d.mealId ? T.meal(d.mealId) : null; (S.nutrition.logs[day] = S.nutrition.logs[day] || []).push({ id: T.uid(), mealId: d.mealId || null, name: m ? m.name : d.name || 'Food', kcal: m ? null : T.num(d.kcal), p: m ? null : T.num(d.p), c: m ? null : T.num(d.c), f: m ? null : T.num(d.f), portion: +d.portion || 1, planned: false, time: d.time }); closeSheet(); refresh(); },
    body: (f, d) => { if (!d.weight && !d.waist && !d.bf) return toast('Enter at least one measurement'); S.body.push({ id: T.uid(), date: d.date, weight: T.num(d.weight), waist: T.num(d.waist), bf: T.num(d.bf), method: d.method }); refresh(); toast('Saved'); },
    anchor: (f, d) => { S.finance.anchors.push({ id: T.uid(), date: d.date, amount: T.round2(+d.amount) }); closeSheet(); refresh(); toast('Balance recorded — forecast updated'); },
    item: (f, d) => {
      const id = f.dataset.id || T.uid(); const old = S.finance.items.find((x) => x.id === id) || {};
      const it = { ...old, id, name: d.name, type: d.type, amount: T.round2(+d.amount), freq: d.freq, day: T.num(d.day), weekday: d.weekday === '' ? null : +d.weekday, date: d.date || null, variable: !!d.variable, src: old.src === 'handoff' && old.amount === T.round2(+d.amount) ? 'handoff' : 'you' };
      if (it.freq === 'monthly' && it.day && (it.day < 1 || it.day > 31)) return toast('Day must be 1–31');
      const i = S.finance.items.findIndex((x) => x.id === id); if (i >= 0) S.finance.items[i] = it; else S.finance.items.push(it); closeSheet(); refresh(); toast('Saved — forecast updated');
    },
    occ: (f, d) => { const k = f.dataset.k; const it = S.finance.items.find((x) => x.id === k.split('|')[0]); const prev = S.finance.overrides[k] || {}; S.finance.overrides[k] = { amount: T.round2(+d.amount), date: d.date, status: d.status || 'expected', paidOn: d.status === 'paid' ? (prev.paidOn || T.today()) : null }; if (it && T.round2(+d.amount) === it.amount) delete S.finance.overrides[k].amount; closeSheet(); refresh(); },
    txn: (f, d) => { const id = f.dataset.id || T.uid(); const prev = S.finance.txns.find((x) => x.id === id) || {}; const t = { id, desc: d.desc, date: d.date, amount: T.round2(Math.abs(+d.amount)) * (d.dir === 'in' ? 1 : -1), status: d.status, paidOn: d.status === 'paid' ? (prev.paidOn || T.today()) : null }; const i = S.finance.txns.findIndex((x) => x.id === id); if (i >= 0) S.finance.txns[i] = t; else S.finance.txns.push(t); closeSheet(); refresh(); },
    video: (f, d) => { if (!/^https:\/\//.test(d.url)) return toast('Use a full https:// link'); (S.study.videos[f.dataset.k] = S.study.videos[f.dataset.k] || []).push({ title: d.title, url: d.url, why: d.why }); refresh(); toast('Video added'); },
    unlock: async (f, d) => {
      const err = document.getElementById('unlockErr'), btn = f.querySelector('button.primary');
      btn.disabled = true; btn.textContent = 'Unlocking…'; err.textContent = '';
      try { await T.unlockPersonal(d.pass); S = T.S; ui.unlock = false; render.last = null; location.hash = '#/home'; render(); toast('Welcome back. Your setup is unlocked.'); }
      catch (e) { err.textContent = e.message; btn.disabled = false; btn.textContent = 'Unlock my setup'; }
    },
    applyUpdate: async (f, d) => {
      const err = document.getElementById('unlockErr'), btn = f.querySelector('button.primary'); btn.disabled = true; btn.textContent = 'Applying…';
      try { await T.unlockPersonal(d.pass, 'personal.enc.json', { merge: true }); S = T.S; ui.update = null; closeSheet(); refresh(); toast('Update applied'); }
      catch (e) { err.textContent = e.message; btn.disabled = false; btn.textContent = 'Apply update'; }
    },
    quote: (f, d) => { (S.myQuotes = S.myQuotes || []).push({ id: T.uid(), text: d.text.trim(), by: d.by.trim() }); refresh(); toast('Quote added'); },
    cycle: (f, d) => {
      if (!d.start || !d.end || d.end < d.start) return toast('End date must be on or after the start date');
      const id = f.dataset.id, c = id ? S.cycles.find((x) => x.id === id) : null;
      if (c) Object.assign(c, { name: d.name.trim() || c.name, start: d.start, end: d.end }); else S.cycles.push({ id: T.uid(), name: d.name.trim() || 'Cycle', start: d.start, end: d.end });
      S.cycles.sort((x, y) => x.start.localeCompare(y.start)); closeSheet(); refresh(); toast(c ? 'Cycle updated' : 'Cycle created');
    },
  };

  /* ---------- change handlers ---------- */
  const C = {
    schedType: (el) => { const w = el.dataset.w, v = el.value; S.schedule[w] = v === 'rest' ? { type: 'rest' } : v.startsWith('gym:') ? { type: 'gym', templateId: v.slice(4) } : { type: 'run', target: S.schedule[w]?.target || 30, optional: v === 'run-opt', label: v === 'run-opt' ? 'Optional run' : 'Run' }; refresh(); },
    schedTarget: (el) => { S.schedule[el.dataset.w].target = +el.value || 30; save(); },
    histEx: (el) => { ui.histEx = el.value; render(); },
    portion: (el) => { const l = (S.nutrition.logs[el.dataset.d] || []).find((x) => x.id === el.dataset.id); if (l) l.portion = +el.value; refresh(); },
    swap: (el) => { const l = (S.nutrition.logs[el.dataset.d] || []).find((x) => x.id === el.dataset.id); if (l) { l.mealId = el.value; l.name = T.meal(el.value)?.name; } refresh(); },
    bankFile: (el) => {
      const file = el.files[0]; if (!file) return;
      file.text().then((txt) => {
        try { const parsed = T.parseBankCSV(txt); const recon = T.reconcile(parsed.rows); ui.importPreview = { parsed, recon }; openSheet(sheetImport); }
        catch (e) { alert('Import failed: ' + e.message); }
        el.value = '';
      });
    },
    importData: (el) => { const file = el.files[0]; if (!file) return; file.text().then((txt) => { try { const obj = JSON.parse(txt); if (!confirm('Replace all current data with this backup?')) return; T.importData(obj); S = T.S; render(); toast('Backup restored'); } catch (e) { alert('Import failed: ' + e.message); } }); },
  };

  /* ---------- delegation ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    const fn = A[el.dataset.a]; if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') && el.dataset.a !== 'closeSheet' && el.dataset.a !== 'setTheme') e.preventDefault();
    if (el.dataset.a === 'closeSheet' && el.dataset.nav) e.preventDefault();
    if (el.dataset.a === 'setTheme') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-f]'); if (!f) return; e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries()); F[f.dataset.f](f, d);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.c && C[el.dataset.c]) return C[el.dataset.c](el, e);
    if (el.dataset.bind) { bindVal(el); save(); if (el.dataset.rerender !== undefined || el.tagName === 'SELECT') render(); }
  });
  document.addEventListener('input', (e) => { const el = e.target; if (el.dataset.bind && el.tagName !== 'SELECT' && el.type !== 'date' && el.type !== 'time') { bindVal(el); saveSoon(); } });
  function bindVal(el) { const v = el.type === 'checkbox' ? el.checked : el.dataset.type === 'num' ? T.num(el.value) : el.value; setPath(S, el.dataset.bind, v); }

  /* ---------- rest timer ---------- */
  let timerEnd = 0, timerInt = null;
  function startTimer(sec) {
    timerEnd = Date.now() + sec * 1000; clearInterval(timerInt);
    let el = document.querySelector('.timer'); if (!el) { el = document.createElement('div'); el.className = 'timer'; el.title = 'Tap to cancel'; el.onclick = () => { clearInterval(timerInt); el.remove(); }; document.body.appendChild(el); }
    const tick = () => { const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000)); el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (!left) { clearInterval(timerInt); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); el.textContent = 'Rest done ✓'; notify('Rest done', 'Next set.'); setTimeout(() => el.remove(), 4000); } };
    tick(); timerInt = setInterval(tick, 500);
  }

  /* ---------- in-app reminders ---------- */
  const fired = new Set();
  async function notify(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }); else new Notification(title, { body }); } catch (e) {}
  }
  function checkReminders() {
    if (!S.settings.notifications) return;
    const { date, time } = T.londonNow();
    for (const m of T.mealsPlanned(date)) { const k = 'meal' + date + m.time; if (m.time === time && !fired.has(k)) { fired.add(k); notify('🍽 ' + (m.meal?.name || 'Meal time'), 'Planned for ' + m.time); } }
    if (time === '09:00') { const k = 'bills' + date; if (!fired.has(k)) { fired.add(k); const due = T.occurrences(T.addDays(date, 1), T.addDays(date, 1)).filter((o) => o.amount < 0); if (due.length) notify('💳 Due tomorrow', due.map((o) => `${o.name} ${T.gbp(-o.amount)}`).join(', ')); } }
  }
  setInterval(checkReminders, 30000);

  /* ---------- boot ---------- */
  window.addEventListener('hashchange', () => { ui.sheet = null; render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  if (FIRST_RUN) ui.unlock = true;
  async function checkUpdate() { if (!S.settings.unlocked || ui.unlock) return; const hd = await T.personalHeader(); if (hd && hd.rev > (S.settings.personalRev || 0)) { ui.update = hd; if (!ui.sheet) render(); } }
  setTimeout(checkUpdate, 1200);
  if (!location.hash) location.hash = '#/home';
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  window.__TK_UI = { render, A }; // for testing
})();
