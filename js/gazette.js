/* The McKenna Gazette — insight articles for the daily newspaper, your personal quotes, and money principles.
 * Articles are original writing. Scripture quotations are short and from the Douay-Rheims (public domain);
 * elsewhere passages are referenced and paraphrased.
 * sec: lead | scripture | convo | craft.  req: [[course, week], ...] must be unlocked (spoiler guard).
 */
(function () {
  const A = [
    /* Lead articles tied to your own notebook are stored encrypted and merged in at runtime. */

    /* ---------------- FROM THE SCRIPTURES ---------------- */
    { id: 's1', sec: 'scripture', head: 'Keep Thy Heart', deck: 'Proverbs 4:23', themes: ['conscience'], refs: 'Proverbs 4:23',
      body: ['"With all watchfulness keep thy heart, because life issueth out from it." Your heart is the wellspring: what you allow in shapes everything that flows out.', 'Practical guarding: what you watch, who you confide in, what you replay at night. Padlocked apps are a form of heart-keeping.'] },
    { id: 's2', sec: 'scripture', head: 'Where Thy Treasure Is', deck: 'Matthew 6:21', themes: ['freedom'], refs: 'Matthew 6:19–21',
      body: ['"For where thy treasure is, there is thy heart also." Jesus doesn\'t say the heart leads and money follows. He says money leads and the heart follows.', 'Want to care more about something? Invest in it — time, money, attention. Your budget is a portrait of your heart, and a tool for redrawing it.'] },
    { id: 's3', sec: 'scripture', head: 'What Profit?', deck: 'Mark 8:36', themes: ['conscience', 'responsibility'], refs: 'Mark 8:36',
      body: ['"For what shall it profit a man, if he gain the whole world, and suffer the loss of his soul?" The question of ambition, asked by the one who refused all the kingdoms of the world in the wilderness.', 'Ambition isn\'t condemned. A bad trade is. Know what you will never sell.'] },
    { id: 's4', sec: 'scripture', head: 'Joseph Says No', deck: 'Genesis 39', themes: ['conscience', 'freedom'], refs: 'Genesis 39:6–12',
      body: ['Alone, trusted, far from home, propositioned day after day by his master\'s wife, Joseph refuses: "How then can I do this wicked thing, and sin against my God?"', 'Notice two things. He named it plainly — no softening. And when talking failed, he ran, leaving his cloak behind. Some temptations are to be argued with. Others are to be fled from.'] },
    { id: 's5', sec: 'scripture', head: 'Meant for Evil, Turned to Good', deck: 'Genesis 50:20', themes: ['forgiveness', 'redemption'], refs: 'Genesis 50:15–21',
      body: ['Years after his brothers sold him, Joseph holds their lives in his hands. He says: "You thought evil against me: but God turned it into good."', 'Forgiveness here does not deny the evil. It names it — and then refuses to let it have the final meaning. Compare the Count of Monte Cristo, who holds the same power and chooses differently.'] },
    { id: 's6', sec: 'scripture', head: 'David on the Rooftop', deck: '2 Samuel 11–12', themes: ['conscience', 'justice'], refs: '2 Samuel 11–12; Psalm 51',
      body: ['At the season when kings go to war, David stayed home. From the rooftop he saw Bathsheba — and a man after God\'s own heart committed adultery and arranged a murder.', 'Power multiplied the temptation and hid the crime, just as you have observed about leaders. What saved David was not his position but his response when confronted by Nathan: "I have sinned." Psalm 51 is that prayer. Real repentance does not hide behind a title.'] },
    { id: 's7', sec: 'scripture', head: 'An Excellent Spirit', deck: 'Daniel 6:3', themes: ['responsibility'], refs: 'Daniel 6:1–5',
      body: ['Daniel rose above the other officials of Persia "because a greater spirit of God was in him". His rivals searched for corruption and found none. Their only hope was to attack his prayer life.', 'That is the goal: competence so reliable and integrity so complete that the only thing critics can point to is your faith.'] },
    { id: 's8', sec: 'scripture', head: 'Ask for Wisdom', deck: 'James 1:5', themes: ['responsibility'], refs: 'James 1:5–8',
      body: ['James promises that whoever lacks wisdom may ask God, who gives to all abundantly and does not upbraid. No scolding for asking.', 'Then the condition: ask in faith, not wavering, for the double-minded man is inconstant in all his ways. Clarity of commitment comes before clarity of answers.'] },
    { id: 's10', sec: 'scripture', head: 'Peter Restored', deck: 'John 21:15–17', themes: ['forgiveness', 'redemption'], refs: 'John 21:15–19',
      body: ['After three denials, Jesus asks Peter three times by a charcoal fire: "Lovest thou me?" Each answer is followed by a commission: feed my sheep.', 'Jesus does not make Peter grovel. He restores him to purpose. Accepting forgiveness means accepting the work that comes with it — not endlessly revisiting the fire where you failed.'] },
    { id: 's11', sec: 'scripture', head: 'Rest Is Commanded', deck: 'Exodus 20:8–10; Mark 2:27', themes: ['freedom'], refs: 'Exodus 20:8–11; Mark 2:27',
      body: ['Rest is not a reward for finishing. It is a command, woven into creation. "The sabbath was made for man, and not man for the sabbath."', 'That is why your Workout ring never punishes a rest day. Recovery is part of the training, not a break from it.'] },
    { id: 's12', sec: 'scripture', head: 'Faithful in the Small', deck: 'Zechariah 4:10', themes: ['responsibility'], refs: 'Zechariah 4:10; Luke 16:10',
      body: ['When the rebuilt temple looked pitiful next to Solomon\'s, the prophet asked: who hath despised little days?', 'Thirty minutes of CAGED. Ten minutes of prayer. One honest meal log. Little days are where great years are built.'] },

    /* ---------------- THE GREAT CONVERSATION (spoiler-guarded) ---------------- */
    { id: 'c1', sec: 'convo', head: 'Odysseus, Joseph and the Disguised Return', deck: 'Two men who come home unrecognised', themes: ['justice', 'forgiveness'], req: [['odyssey', 6]], refs: 'Odyssey 13–14; Genesis 42–45',
      body: ['Odysseus returns to Ithaca disguised as a beggar to test who has been loyal. Joseph, governor of Egypt, keeps his identity hidden from the brothers who sold him, and tests them too.', 'Both are probing the same thing: has anyone changed? Watch how differently the tests end. Homer moves toward reckoning; Genesis toward tears and reconciliation.'] },
    { id: 'c3', sec: 'convo', head: 'The Count and the Sermon on the Mount', deck: 'Vengeance perfected, and its limits', themes: ['justice', 'forgiveness'], req: [['monte', 7], ['bible', 5]], refs: 'Matthew 5:38–44; Romans 12:19',
      body: ['Edmond Dantès builds the most perfect revenge in literature. The Sermon on the Mount asks for something that sounds impossible beside it: love your enemies, pray for those who persecute you.', 'Dumas is not naive about this. Watch where his hero begins to doubt whether he has the right to play Providence. Romans 12 had already answered: revenge belongs to God.'] },
    { id: 'c4', sec: 'convo', head: 'Sowell, Solomon and Incentives', deck: 'Why good intentions are not enough', themes: ['responsibility'], refs: 'Basic Economics Part I; Proverbs 14:15; Luke 14:28',
      body: ['Sowell insists policies be judged by results, not intentions. Scripture got there first: the innocent believeth every word; the discreet man considereth his steps (Proverbs 14:15). Count the cost before building the tower (Luke 14:28).', 'Applied to yourself: judge your habits by what they produce, not by how they make you feel. Stage-two thinking is a spiritual discipline as well as an economic one.'] },
    { id: 'c5', sec: 'convo', head: 'Achilles, Ecclesiastes and the Point of It All', deck: 'Two voices on glory and mortality', themes: ['suffering'], req: [['odyssey', 5], ['bible', 2]], refs: 'Odyssey 11; Ecclesiastes 2',
      body: ['In the underworld, Achilles — who chose glory over long life — says he would rather be a poor man\'s servant alive than king among the dead. The Teacher of Ecclesiastes built houses, gardens and fortunes, and called it all vapour.', 'Both expose the emptiness of achievement pursued for itself. Ecclesiastes, unlike Homer, ends with a direction: fear God and keep his commandments. Meaning comes from orientation, not accumulation.'] },
    { id: 'c6', sec: 'convo', head: 'Odysseus at the Mast', deck: 'Pre-commitment in Homer and Scripture', themes: ['freedom'], req: [['odyssey', 5]], refs: 'Odyssey 12; Job 31:1; Romans 13:14',
      body: ['Odysseus has himself tied to the mast before the Sirens sing. Job made a covenant with his eyes. Paul says make not provision for the flesh.', 'All three know the same truth: decide before the temptation arrives, because you will not decide well during it. Your padlocked phone is a mast.'] },

    /* ---------------- CRAFT & DISCIPLINE ---------------- */
    { id: 'd1', sec: 'craft', head: 'The Metronome Does Not Lie', deck: 'Guitar, honesty and slow practice', themes: ['responsibility'],
      body: ['Practising to a metronome is humbling because it exposes every rushed beat. Slow down until you are perfectly in time, then raise the tempo a few clicks. Speed is a by-product of accuracy.', 'It is the same with character: honest feedback, small increments, no faking the tempo.'] },
    { id: 'd3', sec: 'craft', head: 'One Hour, One Thing', deck: 'The economics of attention', themes: ['freedom'],
      body: ['Every switch of task leaves part of your attention behind. One uninterrupted hour, headphones on, timer running, will often outproduce a scattered afternoon.', 'Treat the focus hour like a gym session: scheduled, protected, and done before the day can negotiate it away.'] },
    { id: 'd4', sec: 'craft', head: 'Ten Minutes of Silence', deck: 'Prayer as a daily appointment', themes: ['conscience', 'redemption'], refs: 'Matthew 6:6; Mark 1:35',
      body: ['"Enter into thy chamber, and having shut the door, pray to thy Father in secret." Jesus himself rose very early and went out to a desert place to pray.', 'Ten minutes is enough to begin. Same time, same place. Speak honestly, then listen.'] },
  ];

  /* ---------------- your quotes (quote of the day) ---------------- */
  const MY_QUOTES = []; // your quotes are stored encrypted (see personal.enc.json)

  /* ---------------- Ramsey ---------------- */
  // Ramsey has no single official "10 rules" list. These are the ten principles he teaches most consistently,
  // summarised in our own words and built on his 7 Baby Steps (ramseysolutions.com). UK notes are our adaptation.
  const RAMSEY = [
    { t: 'Give every pound a job', d: 'Make a written, zero-based budget before the month begins, so income minus outgoings equals zero. Tell your money where to go instead of wondering where it went.', uk: 'Your Finance tab is the plan; review it on payday.' },
    { t: 'Save a starter emergency fund', d: 'Baby Step 1: save $1,000 as fast as you can, so small emergencies don\'t go on a credit card.', uk: 'UK followers usually use £1,000.' },
    { t: 'Kill debt with the snowball', d: 'Baby Step 2: list every debt except the mortgage from smallest to largest balance. Pay minimums on all of them, then throw every spare pound at the smallest. Each debt you clear rolls its payment into the next.', uk: 'Credit cards are typical snowball targets.' },
    { t: 'Stop borrowing', d: 'No new debt while you\'re getting out of it. Ramsey says close credit cards and pay cash — "debt is dumb, cash is king".', uk: 'Includes car finance and buy-now-pay-later.' },
    { t: 'Fully fund your emergency fund', d: 'Baby Step 3: build 3–6 months of essential expenses once consumer debt is gone.', uk: 'Easy-access savings account, kept separate from spending.' },
    { t: 'Invest 15% for retirement', d: 'Baby Step 4: put 15% of household income toward retirement.', uk: 'UK equivalent: workplace pension (with employer match) plus a Stocks & Shares or Lifetime ISA.' },
    { t: 'Pay off your home early', d: 'Baby Step 6: throw extra money at the mortgage once Steps 1–4 are in place (Step 5 is children\'s education).', uk: 'Check your lender\'s overpayment limit (often 10% a year) to avoid early-repayment charges.' },
    { t: 'Live below your means', d: 'Don\'t buy things you don\'t need with money you don\'t have to impress people you don\'t like. Buy reliable cars with cash rather than new on finance.', uk: '' },
    { t: 'Behaviour beats knowledge', d: 'Ramsey says personal finance is 80% behaviour and 20% head knowledge. Knowing what to do is easy; doing it consistently is the work.', uk: '' },
    { t: 'Build wealth and give', d: 'Baby Step 7: build wealth, and be outrageously generous with it. Money is a tool for serving others, not a scorecard.', uk: '' },
  ];
  const BABY_STEPS = ['Save a starter emergency fund', 'Pay off all debt except the house (snowball)', 'Save 3–6 months of expenses', 'Invest 15% for retirement', 'Save for children\'s education', 'Pay off the home early', 'Build wealth and give'];

  window.TK_GAZETTE = { articles: A, byId: (id) => A.find((a) => a.id === id), MY_QUOTES, RAMSEY, BABY_STEPS };
})();
