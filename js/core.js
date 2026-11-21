/* The Key — core engine: storage, dates, rings, finance, progression, exports. No DOM here. */
(function () {
  const KEY = 'thekey:v1';
  const TZ = 'Europe/London';

  /* ---------- utils ---------- */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const gbp = (x) => (x < 0 ? '−' : '') + '£' + Math.abs(round2(x)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (v) => (v === '' || v === null || v === undefined || isNaN(+v) ? null : +v);

  /* ---------- dates (all as 'YYYY-MM-DD' strings in Europe/London) ---------- */
  const fmtParts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function londonNow() {
    const p = Object.fromEntries(fmtParts.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  }
  const today = () => londonNow().date;
  // Pure calendar arithmetic on date strings via UTC noon (no DST issues).
  const toD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
  const fromD = (d) => d.toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = toD(s); d.setUTCDate(d.getUTCDate() + n); return fromD(d); };
  const diffDays = (a, b) => Math.round((toD(b) - toD(a)) / 86400000);
  const weekday = (s) => toD(s).getUTCDay();
  const startOfWeek = (s) => addDays(s, -((weekday(s) + 6) % 7)); // Monday
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m 1-12
  const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => toD(s).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
  const range = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };

  /* ---------- store ---------- */
  let S = null;
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
    if (!S || S.version !== 1) S = window.TK_SEED();
    // forward-compatible defaults
    const seed = window.TK_SEED();
    for (const k of Object.keys(seed)) if (S[k] === undefined) S[k] = seed[k];
    for (const k of Object.keys(seed.study)) if (S.study[k] === undefined) S.study[k] = seed.study[k];
    if (!S.settings.trackingSince) { S.settings.trackingSince = today(); localStorage.setItem(KEY, JSON.stringify(S)); }
    return S;
  }
  let saveTimer = null;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { alert('Could not save — storage full or blocked. Export a backup now.'); }
  }
  function resetAll() { localStorage.removeItem(KEY); S = window.TK_SEED(); save(); }
  function importData(obj) {
    if (!obj || obj.version !== 1 || !obj.settings) throw new Error('Not a The Key backup file');
    S = obj; save();
  }

  /* ---------- cycles ---------- */
  function currentCycle(d = today()) {
    return S.cycles.find((c) => d >= c.start && d <= c.end) || S.cycles[S.cycles.length - 1];
  }
  function cycleInfo(d = today()) {
    const c = currentCycle(d); if (!c) return null;
    const total = diffDays(c.start, c.end) + 1;
    const day = clamp(diffDays(c.start, d) + 1, 0, total);
    return { ...c, total, day, week: Math.ceil(Math.max(day, 1) / 7), pct: day / total, active: d >= c.start && d <= c.end };
  }

  /* ---------- training helpers ---------- */
  const tpl = (id) => S.templates.find((t) => t.id === id);
  function planFor(d) {
    const st = S.dayStatus[d];
    const p = S.schedule[weekday(d)] || { type: 'rest' };
    if (st === 'rest' || st === 'ill') return { type: 'rest', status: st, label: st === 'ill' ? 'Unwell — recovery day' : 'Planned rest' };
    return p;
  }
  const sessionsOn = (d) => S.sessions.filter((s) => s.date === d);
  const runsOn = (d) => S.runs.filter((r) => r.date === d);
  const workSets = (sess) => sess.exercises.flatMap((e) => e.sets.filter((x) => x.done && !x.warmup));
  function plannedSetCount(t) { return t ? t.exercises.reduce((a, e) => a + e.sets.length, 0) : 0; }
  const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + Math.min(r, 15) / 30) : 0); // Epley, capped at 15 reps

  function exerciseHistory(name) {
    const n = name.trim().toLowerCase();
    const out = [];
    for (const s of [...S.sessions].sort((a, b) => a.date.localeCompare(b.date))) {
      for (const e of s.exercises) if (e.name.trim().toLowerCase() === n) {
        const sets = e.sets.filter((x) => x.done && !x.warmup && x.r != null);
        if (sets.length) out.push({ date: s.date, sets, best: Math.max(...sets.map((x) => e1rm(+x.w || 0, +x.r || 0))), top: Math.max(...sets.map((x) => +x.w || 0)) });
      }
    }
    return out;
  }

  /* Advisory double-progression. Never auto-applied. */
  function suggestNext(ex) {
    const hist = exerciseHistory(ex.name);
    const last = hist.length ? hist[hist.length - 1].sets : ex.sets.filter((s) => s.r != null);
    const source = hist.length ? `your session on ${fmtDate(hist[hist.length - 1].date)}` : 'your baseline routine';
    if (!last.length || ex.repLow == null || ex.repHigh == null) return { text: 'Log a few sessions with a target rep range set to get suggestions.', kind: 'info' };
    const inc = ex.inc || 2.5;
    const reps = last.map((s) => +s.r);
    const rpes = last.map((s) => num(s.rpe)).filter((x) => x != null);
    const maxRpe = rpes.length ? Math.max(...rpes) : null;
    const topW = Math.max(...last.map((s) => +s.w || 0));
    if (reps.every((r) => r >= ex.repHigh) && (maxRpe == null || maxRpe <= 8.5)) {
      return { kind: 'up', text: `All working sets hit ${ex.repHigh}+ reps in ${source}${maxRpe != null ? ` (max RPE ${maxRpe})` : ''}. Consider ${topW > 0 ? `${round2(topW + inc)} kg` : `adding ${inc} kg`} next time and work back up the rep range.` };
    }
    if (reps.some((r) => r < ex.repLow) || (maxRpe != null && maxRpe >= 9.5)) {
      return { kind: 'hold', text: `Some sets fell below ${ex.repLow} reps${maxRpe != null && maxRpe >= 9.5 ? ' or felt near-maximal' : ''} in ${source}. Hold ${topW || 'this'}${topW ? ' kg' : ''}; if it repeats over 2 sessions, consider a small reduction or a recovery check.` };
    }
    return { kind: 'hold', text: `Stay at ${topW ? topW + ' kg' : 'this load'} and aim for +1 rep per set (target ${ex.repLow}–${ex.repHigh}). Based on ${source}.` };
  }

  /* ---------- nutrition helpers ---------- */
  function dayType(d) { return S.nutrition.dayTypeOverride[d] || (S.nutrition.officeDays.includes(weekday(d)) ? 'office' : 'home'); }
  const meal = (id) => S.nutrition.meals.find((m) => m.id === id);
  function mealsPlanned(d) { return S.nutrition.plans[dayType(d)].items.map((it) => ({ ...it, meal: meal(it.mealId) })); }
  const mealLogs = (d) => S.nutrition.logs[d] || [];
  function dayNutrition(d) {
    const logs = mealLogs(d); let kcal = 0, p = 0, c = 0, f = 0, unknown = 0;
    for (const l of logs) {
      const m = l.mealId ? meal(l.mealId) : null;
      const src = { kcal: l.kcal ?? m?.kcal, p: l.p ?? m?.p, c: l.c ?? m?.c, f: l.f ?? m?.f };
      const k = l.portion ?? 1;
      if (src.kcal == null) unknown++; else kcal += src.kcal * k;
      p += (src.p || 0) * k; c += (src.c || 0) * k; f += (src.f || 0) * k;
    }
    return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f), unknown, count: logs.length };
  }

  /* ---------- rings ----------
   * Each returns {pct: 0..1 | null, state: 'future'|'rest'|'unlogged'|'partial'|'done', detail}
   */
  function workoutRing(d) {
    const t = today();
    if (d > t) return { pct: null, state: 'future' };
    const plan = planFor(d);
    const sessions = sessionsOn(d), runs = runsOn(d);
    const sets = sessions.reduce((a, s) => a + workSets(s).length, 0);
    const runMin = runs.reduce((a, r) => a + (+r.min || 0), 0);
    const sessMin = sessions.reduce((a, s) => a + (+s.min || 0), 0);
    let pct = 0, detail = '';
    if (plan.type === 'gym') {
      const planned = plannedSetCount(tpl(plan.templateId)) || 12;
      pct = clamp(sets / planned);
      if (runMin) pct = clamp(pct + runMin / (S.settings.runDefaultMin * 2));
      detail = `${sets}/${planned} working sets${runMin ? ` · ${runMin} min run` : ''}`;
    } else if (plan.type === 'run' && !plan.optional) {
      pct = clamp(runMin / (plan.target || S.settings.runDefaultMin));
      if (sets) pct = clamp(pct + sets / 24);
      detail = `${runMin}/${plan.target} min run${sets ? ` · ${sets} sets` : ''}`;
    } else {
      // rest or optional day: activity is a bonus, absence is not a failure
      const active = runMin + sessMin + sets * 3;
      if (!active) return { pct: null, state: 'rest', detail: plan.status === 'ill' ? 'Unwell — recovery' : plan.optional ? 'Optional run day — rest is fine' : 'Rest day' };
      pct = clamp(active / S.settings.restDayActivityMin);
      detail = `Bonus activity: ${runMin ? runMin + ' min run ' : ''}${sets ? sets + ' sets' : ''}`.trim();
    }
    if (!sessions.length && !runs.length) return { pct: 0, state: 'unlogged', detail: 'Nothing logged' };
    return { pct, state: pct >= 1 ? 'done' : 'partial', detail };
  }
  function dietRing(d) {
    if (d > today()) return { pct: null, state: 'future' };
    const planned = mealsPlanned(d).length || 1;
    const logs = mealLogs(d);
    if (!logs.length) return { pct: 0, state: 'unlogged', detail: 'No meals logged' };
    const done = logs.reduce((a, l) => a + Math.min(l.portion ?? 1, 1), 0);
    const pct = clamp(done / planned);
    const n = dayNutrition(d);
    const tgt = S.nutrition.targets.kcal;
    let detail = `${logs.length}/${planned} meals`;
    if (!n.unknown && tgt) detail += ` · ${n.kcal} / ${tgt} kcal`;
    return { pct, state: pct >= 1 ? 'done' : 'partial', detail, kcal: n.kcal };
  }
  function studyMinutes(d) { return S.study.log.filter((x) => x.date === d).reduce((a, x) => a + (+x.min || 0), 0); }
  function readingRing(d) {
    if (d > today()) return { pct: null, state: 'future' };
    const min = studyMinutes(d), goal = S.settings.readingGoalMin || 30;
    if (!min) return { pct: 0, state: 'unlogged', detail: 'No study logged' };
    const pct = clamp(min / goal);
    return { pct, state: pct >= 1 ? 'done' : 'partial', detail: `${min}/${goal} min` };
  }
  const rings = (d) => ({ workout: workoutRing(d), diet: dietRing(d), reading: readingRing(d) });

  function ringAverages(dates) {
    const out = {};
    for (const k of ['workout', 'diet', 'reading']) {
      const since = S.settings.trackingSince || '0000';
      // days before you started using The Key are excluded unless you back-filled them
      const vals = dates.map((d) => [d, rings(d)[k]]).filter(([d, r]) => r.state !== 'future' && r.state !== 'rest' && !(r.state === 'unlogged' && d < since)).map(([, r]) => r);
      out[k] = vals.length ? vals.reduce((a, r) => a + r.pct, 0) / vals.length : null;
      out[k + 'Closed'] = vals.filter((r) => r.pct >= 1).length;
      out[k + 'Days'] = vals.length;
    }
    return out;
  }

  /* ---------- finance engine (deterministic) ---------- */
  function occurrences(from, to) {
    // Returns scheduled occurrences in (from, to] window inclusive of both ends.
    const out = [];
    for (const it of S.finance.items) {
      const sign = it.type === 'income' ? 1 : -1;
      const push = (date) => {
        const key = it.id + '|' + date;
        const ov = S.finance.overrides[key] || {};
        const d = ov.date || date;
        if (d < from || d > to) return;
        out.push({ key, itemId: it.id, name: it.name, date: d, amount: sign * (ov.amount ?? it.amount), status: ov.status || 'expected', paidOn: ov.paidOn, variable: !!it.variable, type: it.type });
      };
      if (it.freq === 'monthly' && it.day) {
        let [y, m] = from.split('-').map(Number); m -= 1; if (m < 1) { m = 12; y--; } // start one month early to catch moved overrides
        for (let i = 0; i < 40; i++) {
          const dd = Math.min(it.day, daysInMonth(y, m));
          const date = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
          if (date > addDays(to, 31)) break;
          push(date);
          m++; if (m > 12) { m = 1; y++; }
        }
      } else if (it.freq === 'weekly' && it.weekday != null) {
        let d = addDays(from, -7);
        while (weekday(d) !== +it.weekday) d = addDays(d, 1);
        for (; d <= addDays(to, 7); d = addDays(d, 7)) push(d);
      } else if (it.freq === 'yearly' && it.date) {
        const md = it.date.slice(5);
        for (let y = +from.slice(0, 4) - 1; y <= +to.slice(0, 4) + 1; y++) push(`${y}-${md}`);
      } else if (it.freq === 'once' && it.date) push(it.date);
    }
    for (const t of S.finance.txns) if (t.date >= from && t.date <= to) out.push({ key: 'txn|' + t.id, txnId: t.id, name: t.desc, date: t.date, amount: +t.amount, status: t.status || 'expected', paidOn: t.paidOn, manual: true });
    return out.sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
  }
  const undated = () => S.finance.items.filter((it) => (it.freq === 'monthly' && !it.day) || (it.freq === 'weekly' && it.weekday == null) || ((it.freq === 'yearly' || it.freq === 'once') && !it.date));
  function latestAnchor(onOrBefore) {
    return [...S.finance.anchors].filter((a) => a.date <= onOrBefore).sort((a, b) => a.date.localeCompare(b.date)).pop() || null;
  }
  /* Projected balance at end of `d`: latest actual balance at or before d, plus every occurrence dated after that
     snapshot up to d, excluding items you marked paid on/before the snapshot date (already in the bank figure). */
  function projectedBalance(d) {
    const a = latestAnchor(d); if (!a) return null;
    const occ = occurrences(addDays(a.date, 1), d).filter((o) => !(o.status === 'paid' && o.paidOn && o.paidOn <= a.date));
    return { balance: round2(a.amount + occ.reduce((s, o) => s + o.amount, 0)), anchor: a, count: occ.length };
  }
  function forecastSeries(from, days) {
    const out = []; for (let i = 0; i <= days; i++) { const d = addDays(from, i); const p = projectedBalance(d); out.push({ date: d, bal: p ? p.balance : null }); }
    return out;
  }
  function monthlySummary() {
    let inc = 0, exp = 0, weekly = 0;
    for (const it of S.finance.items) {
      const m = it.freq === 'monthly' ? it.amount : it.freq === 'weekly' ? it.amount * 52 / 12 : it.freq === 'yearly' ? it.amount / 12 : 0;
      if (it.type === 'income') inc += m; else if (it.freq === 'weekly') weekly += m; else exp += m;
    }
    return { income: round2(inc), monthlyBills: round2(exp), weeklyAvg: round2(weekly), afterBills: round2(inc - exp), afterAll: round2(inc - exp - weekly) };
  }

  /* ---------- academy ---------- */
  const course = (id) => window.TK_COURSES.find((c) => c.id === id);
  const modKey = (cid, w) => cid + ':' + w;
  function courseProgress(cid) {
    const c = course(cid); let read = 0, lect = 0, done = 0, quizS = [], ans = 0;
    c.weeks.forEach((_, i) => {
      const p = S.study.progress[modKey(cid, i)] || {};
      if (p.read) read++; if (p.lecture) lect++; if (p.read && p.lecture) done++;
      const q = S.study.quiz[modKey(cid, i)]; if (q && q.total) quizS.push(q.score / q.total);
      const a = S.study.answers[modKey(cid, i)] || {}; if (Object.values(a).some((v) => v && v.trim())) ans++;
    });
    const n = c.weeks.length;
    const quizAvg = quizS.length ? quizS.reduce((a, b) => a + b, 0) / quizS.length : null;
    // mastery = mean of: reading done, lectures done, reflections written, and quiz average (only once a quiz is taken)
    const parts = [read / n, lect / n, ans / n]; if (quizAvg != null) parts.push(quizAvg);
    return { read, lect, done, ans, quizAvg, pct: (read + lect) / (n * 2), mastery: clamp(parts.reduce((a, b) => a + b, 0) / parts.length) };
  }
  // spoiler guard: fiction module i is "unlocked" if week i-1 reading is marked read (or user revealed)
  function unlocked(cid, i) {
    const c = course(cid); if (!c.fiction || i === 0) return true;
    if ((S.study.progress[modKey(cid, i)] || {}).revealed) return true;
    return !!(S.study.progress[modKey(cid, i - 1)] || {}).read;
  }

  /* ---------- exports ---------- */
  function download(name, text, type = 'application/json') {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function icsEscape(s) { return String(s).replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n'); }
  function buildICS({ bills = true, meals = true, training = true, monthsAhead = 3 } = {}) {
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Key//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:The Key', 'X-WR-TIMEZONE:Europe/London'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const ev = (o) => {
      L.push('BEGIN:VEVENT', 'UID:' + o.uid + '@thekey', 'DTSTAMP:' + stamp);
      if (o.allDay) L.push('DTSTART;VALUE=DATE:' + o.date.replace(/-/g, ''));
      else L.push('DTSTART;TZID=Europe/London:' + o.date.replace(/-/g, '') + 'T' + o.time.replace(':', '') + '00', 'DURATION:PT' + (o.dur || 30) + 'M');
      if (o.rrule) L.push('RRULE:' + o.rrule);
      L.push('SUMMARY:' + icsEscape(o.title));
      if (o.desc) L.push('DESCRIPTION:' + icsEscape(o.desc));
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(o.title), 'TRIGGER:' + (o.alarm || '-PT0M'), 'END:VALARM', 'END:VEVENT');
    };
    const t = today();
    if (bills) {
      const end = addDays(t, monthsAhead * 31);
      for (const o of occurrences(t, end)) ev({ uid: o.key.replace(/\W/g, ''), allDay: true, date: o.date, title: `${o.amount > 0 ? '💷 In' : '💳 Out'}: ${o.name} ${gbp(Math.abs(o.amount))}`, desc: 'Projected by The Key. Check your banking app for actual status.', alarm: '-PT15H' });
    }
    const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    if (meals) {
      for (const type of ['home', 'office']) {
        const days = [0, 1, 2, 3, 4, 5, 6].filter((w) => (S.nutrition.officeDays.includes(w) ? 'office' : 'home') === type);
        if (!days.length) continue;
        let first = t; while (!days.includes(weekday(first))) first = addDays(first, 1);
        for (const it of S.nutrition.plans[type].items) {
          const m = meal(it.mealId);
          ev({ uid: `meal${type}${it.mealId}${it.time.replace(':', '')}`, date: first, time: it.time, dur: 30, rrule: 'FREQ=WEEKLY;BYDAY=' + days.map((w) => DAYS[w]).join(','), title: `🍽 ${m ? m.name : 'Meal'}`, desc: `${S.nutrition.plans[type].label} plan${m && m.kcal ? ` · ${m.kcal} kcal` : ''}` });
        }
      }
    }
    if (training) {
      for (let w = 0; w < 7; w++) {
        const p = S.schedule[w]; if (!p || p.type === 'rest') continue;
        let first = t; while (weekday(first) !== w) first = addDays(first, 1);
        const title = p.type === 'gym' ? `🏋️ Gym: ${tpl(p.templateId)?.name || 'Session'}` : `🏃 ${p.label || 'Run'} (${p.target} min)`;
        ev({ uid: 'train' + w, date: first, time: p.type === 'gym' ? '07:00' : '08:00', dur: p.type === 'gym' ? 75 : p.target, rrule: 'FREQ=WEEKLY;BYDAY=' + DAYS[w], title, alarm: '-PT30M' });
      }
    }
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }

  /* ---------- encrypted personal setup (AES-256-GCM, key from PBKDF2-SHA256) ---------- */
  const b64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  async function unlockPersonal(passphrase, url = 'personal.enc.json') {
    if (!window.crypto?.subtle) throw new Error('This browser needs HTTPS to unlock.');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('No personal setup file found on this site.');
    const box = await res.json();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase.trim()), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(box.salt), iterations: box.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    let plain;
    try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct)); }
    catch (e) { throw new Error('That passphrase didn\'t unlock it. Check spelling and spaces.'); }
    const data = JSON.parse(new TextDecoder().decode(plain));
    const st = data.seed;
    st.personal = { lockin: data.lockin || [], articles: data.articles || [] };
    st.settings.trackingSince = today();
    st.settings.unlocked = today();
    importData(st);
    return S;
  }

  window.TK = { unlockPersonal, KEY, uid, esc, clamp, round2, gbp, num, londonNow, today, addDays, diffDays, weekday, startOfWeek, daysInMonth, fmtDate, range, toD, fromD,
    load, save, resetAll, importData, get S() { return S; },
    currentCycle, cycleInfo, tpl, planFor, sessionsOn, runsOn, workSets, plannedSetCount, e1rm, exerciseHistory, suggestNext,
    dayType, meal, mealsPlanned, mealLogs, dayNutrition,
    workoutRing, dietRing, readingRing, rings, ringAverages, studyMinutes,
    occurrences, undated, latestAnchor, projectedBalance, forecastSeries, monthlySummary,
    course, modKey, courseProgress, unlocked, download, buildICS };
})();
