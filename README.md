# The Key — Unlock Your Potential

A private, phone-first personal operating system, built as an installable web app (PWA):

- **The Key Rings:** a calendar with four daily rings (Workout, Diet, Reading, Guitar)
- **Training:** strength log with progression suggestions, runs and body metrics
- **Nutrition:** meal plans, logging, consumed vs target, shopping list
- **Finance:** dated cash-flow forecast, bank-balance reconciliation, **bank statement import** (Barclays CSV and generic CSV), Dave Ramsey's principles and a Baby Step tracker
- **The Key Academy:** five 12-week university-style courses (Basic Economics, The Odyssey, Crime and Punishment, The Count of Monte Cristo, selected Scripture), with lectures, quizzes, Socratic questions and a spoiler guard
- **The McKenna Gazette:** a daily vintage newspaper of insights, Scripture and the Great Conversation
- **Lock-in and Progress:** a commitments reference, weekly reviews and cycles

## What's new in v2

- **Today:** a "Now" card that always shows the single next thing to do (meal, session, study, guitar, or closing the day), plus an at-a-glance strip: rings, protein, guitar minutes and safe-to-spend per day.
- **Safe to spend:** the lowest projected balance before your next payday, minus your low-balance buffer, shown as a total and per day.
- **Close the day:** a one-minute evening flow covering meals, training, study, guitar, one line of reflection and tomorrow's preview. On Sundays it adds a weekly review with a focus for next week.
- **Training focus mode:** one exercise at a time with large +/− steppers, an automatic rest timer when you tick a set, auto-advance, and "Use last".
- **Ate as planned**, swipe between months and days, and reading mode in the Academy (text size, progress bar, resume where you left off).
- **Encrypted backups:** automatic AES-256-GCM backups to a private GitHub repository you own (fine-grained token, contents only), restore on any device, and an encrypted file you can save to Files.
- **Navigation:** Today · Rings · Train · Learn · More.

## Privacy model

This repository is public, but **no personal data is readable in it**.

- The owner's personal setup (routine, meal plan, bills, commitments, quotes and personal articles) is stored in `personal.enc.json`. It is encrypted with **AES-256-GCM**, using a key derived from a passphrase with **PBKDF2-SHA256 (600,000 iterations)**.
- On first launch the app asks for the passphrase and decrypts the file **in the browser**, using the Web Crypto API. The passphrase is never sent anywhere.
- Everything you log afterwards is stored **only on your device** (localStorage). Nothing is sent to a server, AI service or bank.
- **Settings → Encrypted backup** saves an encrypted copy to a private GitHub repo automatically, or to Files on demand. The access token stays on the device and is never included in exports.
- Anyone else who opens the site can choose "Start with a blank app" and use it with their own data.

## Install on a phone

1. Open the GitHub Pages URL in Safari (iPhone) or Chrome (Android).
2. Enter the passphrase to unlock your setup.
3. iPhone: Share → **Add to Home Screen**. Android: ⋮ → **Install app**.

## Ring rules

- **Workout:** gym day = ticked working sets ÷ planned sets. Run day = minutes ÷ target. Rest, optional and "unwell" days never count against you.
- **Diet:** planned meals eaten (portion-weighted, capped at 100%) ÷ planned meals. Under-eating lowers the ring.
- **Reading:** study minutes ÷ daily goal.
- **Guitar:** practice minutes logged with the Guitar timer (or added manually) ÷ 30.

## What's real and what isn't

| Capability | Status |
|---|---|
| Rings, training, nutrition, finance forecast, Academy, Gazette, backups | ✅ Working, offline-capable |
| Strength suggestions | ✅ Deterministic double-progression rules (advisory). Not AI |
| AI tutor | ⚠️ "Copy AI tutor prompt" builds a spoiler-safe Socratic prompt to paste into Claude. A built-in tutor needs a backend |
| Reminders | ⚠️ Calendar export (.ics) gives reliable alerts. In-app notifications fire only while the app is open |
| Bank statement import | ✅ Barclays CSV (plus most UK CSVs). Parsed on-device; matches bills, learns bill dates, separates unplanned spending |
| Live bank connection | ❌ Barclays has no personal API, and aggregators are paid and need a server. Statement import is used instead |

## Architecture

Plain HTML/CSS/JS with no framework, build step or dependencies.

```
index.html            app shell + bottom nav
css/styles.css        midnight/gold theme + newspaper styles
fonts/                Unifraktur Maguntia, Playfair Display, Old Standard TT (SIL OFL)
js/gazette.js         public Gazette articles, Ramsey principles
js/data.js            neutral starter data + Academy courses
js/discover.js        short cards (facts, words, dispatches) and original engravings
js/core.js            engine: London dates, rings, finance forecast, progression, .ics, decryption
js/app.js             screens, routing, forms, unlock flow
personal.enc.json     encrypted personal setup
sw.js                 offline cache (code only, never your data)
manifest.webmanifest  install metadata + icons
```

Dates use the Europe/London calendar throughout. Money is calculated deterministically, never by AI. Scripture is quoted from the Douay-Rheims (public domain); other quotations come from public-domain translations, and copyrighted authors are paraphrased.

## Updating

Push to `main`. GitHub Pages redeploys automatically, and the app picks up new code the next time it's opened online. Data on devices is untouched.
