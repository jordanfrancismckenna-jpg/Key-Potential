/* The Key — Discover: content library, original SVG art, and the personalised daily deck.
 * Quotes are only from public-domain translations (named on each card).
 * Copyrighted authors (e.g. Sowell, Hayek) are paraphrased as "idea" cards, never quoted.
 * Each card is tagged with course (c) and week index (w) so the spoiler guard applies.
 * `req` = extra [course, week] pairs that must all be unlocked (cross-book cards).
 */
(function () {
  const BUTLER = 'Homer, Odyssey — trans. Samuel Butler (1900)';
  const GARNETT = 'Dostoevsky, Crime and Punishment — trans. Constance Garnett (1914)';
  const MC1846 = 'Dumas, The Count of Monte Cristo — anonymous English trans. (1846)';
  const DR = 'Douay-Rheims Bible (Challoner revision)';

  const C = [
    /* ---------------- Basic Economics ---------------- */
    { id: 'e1', c: 'econ', w: 0, type: 'idea', title: 'Stage one is only the beginning', text: 'Sowell\'s signature test: don\'t stop at a policy\'s immediate effect. Ask "and then what?" — how will people respond, and what happens in stage two and three?', themes: ['responsibility'] },
    { id: 'e2', c: 'econ', w: 0, type: 'question', title: 'The cost of an hour', text: 'Every hour has alternative uses. What is the real opportunity cost of an hour of scrolling — in guitar practice, reading, or sleep?', themes: ['freedom', 'responsibility'] },
    { id: 'e3', c: 'econ', w: 0, type: 'fact', title: 'From Harlem to Hoover', text: 'Thomas Sowell was born in North Carolina in 1930, grew up in Harlem, served in the Marine Corps, and earned his PhD in economics at the University of Chicago, where Milton Friedman was among his teachers.' },
    { id: 'e4', c: 'econ', w: 0, type: 'idea', title: 'The seen and the unseen', text: 'In 1850 the French economist Frédéric Bastiat argued that bad economics looks only at visible effects, while good economics also traces the effects nobody sees — the jobs and goods that never come into being.', themes: ['responsibility'] },
    { id: 'e5', c: 'econ', w: 0, type: 'art', art: 'scales', title: 'Every choice is a trade-off', text: 'Scarcity means choosing. Choosing means giving something up.' },
    { id: 'e6', c: 'econ', w: 1, type: 'quote', text: 'It is not from the benevolence of the butcher, the brewer, or the baker, that we expect our dinner, but from their regard to their own interest.', by: 'Adam Smith, The Wealth of Nations (1776)', themes: ['freedom'] },
    { id: 'e7', c: 'econ', w: 1, type: 'idea', title: 'Prices are messages', text: 'Friedrich Hayek\'s 1945 essay "The Use of Knowledge in Society" argued that prices pass on knowledge that no single planner could ever hold — scattered across millions of people.', themes: ['freedom'] },
    { id: 'e8', c: 'econ', w: 2, type: 'fact', title: 'An emperor tries price control', text: 'In AD 301 the Roman emperor Diocletian issued an Edict on Maximum Prices for over a thousand goods and wages. It was widely evaded and soon abandoned.', themes: ['justice'] },
    { id: 'e9', c: 'econ', w: 2, type: 'fact', title: 'August 1971', text: 'President Nixon imposed a 90-day freeze on US wages and prices in August 1971. Controls in various forms lasted until 1974 — a modern test case for Sowell\'s chapter on price controls.' },
    { id: 'e10', c: 'econ', w: 2, type: 'idea', title: 'Rent control, both sides', text: 'Swedish economist Assar Lindbeck famously compared rent control\'s effect on a city\'s housing to bombing. Defenders reply that it protects tenants from sudden displacement. The evidence debate is about how big each effect is.', themes: ['justice'] },
    { id: 'e11', c: 'econ', w: 3, type: 'fact', title: 'The pin factory', text: 'Adam Smith described ten workers who, by dividing the work into specialised steps, could make upwards of 48,000 pins a day — where one person alone might struggle to make twenty.' },
    { id: 'e12', c: 'econ', w: 4, type: 'idea', title: 'Losses are information too', text: 'Profits pull resources toward what people value. Losses are the equally important signal to stop. A system that removes losses — through bailouts — loses its ability to correct itself.', themes: ['responsibility'] },
    { id: 'e13', c: 'econ', w: 6, type: 'fact', title: 'The New Jersey study', text: 'In 1994 David Card and Alan Krueger compared fast-food jobs in New Jersey and Pennsylvania after a minimum-wage rise and found no clear job loss — a study that reshaped the debate Sowell joins in Part III.', themes: ['justice'] },
    { id: 'e14', c: 'econ', w: 7, type: 'idea', title: 'Interest is the price of time', text: 'A pound today is worth more than a pound next year, because it can be used now. Interest is the price of that waiting — which is why paying off high-interest debt is often the best "investment" available.', themes: ['responsibility'] },
    { id: 'e15', c: 'econ', w: 10, type: 'fact', title: 'Wine and cloth', text: 'David Ricardo\'s 1817 example: even if Portugal makes both wine and cloth more efficiently than England, both countries gain by specialising in what they give up least to produce. That is comparative advantage.' },
    { id: 'e16', c: 'econ', w: 0, type: 'fact', title: 'Why no equations?', text: 'Basic Economics was first published in 2000 and has gone through five editions. It deliberately contains no graphs or equations — Sowell wanted economics readable by any citizen.' },

    /* ---------------- The Odyssey ---------------- */
    { id: 'o1', c: 'odyssey', w: 0, type: 'quote', text: 'Tell me, O muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy.', by: BUTLER, themes: ['freedom'] },
    { id: 'o2', c: 'odyssey', w: 0, type: 'quote', text: 'See now, how men lay blame upon us gods for what is after all nothing but their own folly.', by: BUTLER + ' · Zeus, Book 1', themes: ['responsibility'] },
    { id: 'o3', c: 'odyssey', w: 0, type: 'word', word: 'ξενία', translit: 'xenía', title: 'Guest-friendship', text: 'The sacred bond between host and guest. Feed the stranger first, ask his name later. The whole poem measures people by how they keep it.', themes: ['justice'] },
    { id: 'o4', c: 'odyssey', w: 0, type: 'word', word: 'πολύτροπος', translit: 'polýtropos', title: 'Man of many turns', text: 'The first adjective Homer gives Odysseus. Many turns of mind — or many turns of the road? Translators have argued about it for centuries.', themes: ['freedom'] },
    { id: 'o5', c: 'odyssey', w: 0, type: 'word', word: 'νόστος', translit: 'nóstos', title: 'Homecoming', text: 'Add álgos (pain) and you get "nostalgia" — a word coined in 1688 by the Swiss physician Johannes Hofer for homesickness so strong it was treated as an illness.' },
    { id: 'o6', c: 'odyssey', w: 0, type: 'fact', title: 'Where "mentor" comes from', text: 'In Book 2 Athena takes the form of Mentor, an old friend of Odysseus, to guide Telemachus. His name became our word for a wise guide.' },
    { id: 'o7', c: 'odyssey', w: 0, type: 'fact', title: 'The wine-dark sea', text: 'Homer\'s sea is "oînops" — wine-faced, wine-dark. Whether the Greeks saw colour differently or meant the sea\'s mood is still debated.' },
    { id: 'o8', c: 'odyssey', w: 0, type: 'art', art: 'sea', title: 'The wine-dark sea', text: 'Twenty years from home: ten at war, ten wandering.' },
    { id: 'o9', c: 'odyssey', w: 0, type: 'fact', title: 'A first, in 2017', text: 'Emily Wilson\'s 2017 version was widely reported as the first English translation of the Odyssey published by a woman — and was written in exactly as many lines as Homer\'s Greek.' },
    { id: 'o10', c: 'odyssey', w: 0, type: 'art', art: 'loom', title: 'Penelope\'s loom', text: 'Weaving by day, unweaving by night: patience as resistance.' },
    { id: 'o11', c: 'odyssey', w: 2, type: 'question', title: 'Calypso\'s offer', text: 'Odysseus is offered a life without ageing or death — and chooses a mortal wife on a rocky island. What would you refuse eternity for?', themes: ['freedom', 'suffering'] },
    { id: 'o12', c: 'odyssey', w: 4, type: 'idea', title: '"Nobody" and the cost of pride', text: 'Odysseus escapes the Cyclops by calling himself Nobody — then shouts his real name from the ship. Brilliant cunning undone by the need to be known.', themes: ['responsibility'] },
    { id: 'o13', c: 'odyssey', w: 5, type: 'quote', text: 'I would rather be a paid servant in a poor man\'s house and be above ground than king of kings among the dead.', by: BUTLER + ' · Achilles, Book 11', themes: ['suffering'] },
    { id: 'o14', c: 'odyssey', w: 5, type: 'idea', title: 'Bound to the mast', text: 'Odysseus hears the Sirens by having himself tied up beforehand. Philosophers call it pre-commitment: the wise self binds the tempted self. A padlocked phone is the same move.', themes: ['freedom', 'responsibility'] },
    { id: 'o15', c: 'odyssey', w: 6, type: 'idea', title: 'Nobility in a pig-farm', text: 'The most faithful host in the poem is Eumaeus, a swineherd. Homer keeps placing true nobility where rank says it shouldn\'t be.', themes: ['justice'] },
    { id: 'o16', c: 'odyssey', w: 8, type: 'fact', title: 'Argos', text: 'The old dog Argos recognises Odysseus after twenty years, when no human does — one of the shortest and most famous scenes in Western literature.' },
    { id: 'o17', c: 'odyssey', w: 10, type: 'art', art: 'bow', title: 'The bow and the twelve axes', text: 'Only the true master of the house can string the bow.' },
    { id: 'o18', c: 'odyssey', w: 0, type: 'fact', title: 'About 12,000 lines', text: 'The Odyssey runs to roughly 12,100 lines of dactylic hexameter. The division into 24 books was probably made later by ancient scholars, one per letter of the Greek alphabet.' },

    /* ---------------- Crime and Punishment ---------------- */
    { id: 'k1', c: 'crime', w: 0, type: 'quote', text: 'On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.', by: GARNETT + ' · opening line', themes: ['conscience'] },
    { id: 'k2', c: 'crime', w: 0, type: 'word', word: 'раскол', translit: 'raskól', title: 'Schism, split', text: 'The root of Raskolnikov\'s name. It also names the great split in the Russian Orthodox Church — and the divided self at the centre of the novel.', themes: ['conscience'] },
    { id: 'k3', c: 'crime', w: 0, type: 'fact', title: 'Reprieved at the last moment', text: 'On 22 December 1849 Dostoevsky was led out to be shot for belonging to a radical circle. The reprieve came at the last moment; he served four years of hard labour in Siberia instead.', themes: ['suffering', 'redemption'] },
    { id: 'k4', c: 'crime', w: 0, type: 'fact', title: 'Written against the clock', text: 'While writing Crime and Punishment in 1866, Dostoevsky also had to deliver a short novel, The Gambler, or lose rights to his work. He dictated it in 26 days to a stenographer, Anna Snitkina — whom he later married.' },
    { id: 'k5', c: 'crime', w: 0, type: 'fact', title: 'A serial thriller', text: 'The novel first appeared in monthly instalments through 1866 in the journal The Russian Messenger. Readers met Raskolnikov one issue at a time.' },
    { id: 'k6', c: 'crime', w: 0, type: 'art', art: 'city', title: 'St Petersburg in July', text: 'Heat, dust, taverns and the Haymarket: a city that presses on the mind.' },
    { id: 'k7', c: 'crime', w: 1, type: 'question', title: 'Who are you in the dream?', text: 'In the horse dream, a boy watches a drunk beat a mare to death. Is Raskolnikov the boy, the horse, or the man with the whip?', themes: ['conscience', 'suffering'] },
    { id: 'k8', c: 'crime', w: 5, type: 'quote', text: 'Pain and suffering are always inevitable for a large intelligence and a deep heart.', by: GARNETT + ' · Part III', themes: ['suffering'] },
    { id: 'k9', c: 'crime', w: 5, type: 'idea', title: 'The extraordinary man', text: 'Raskolnikov\'s article claims a few great people may "step over" moral law for humanity\'s sake. The rest of the novel is Dostoevsky testing that idea on a human body and soul.', themes: ['justice', 'freedom'] },
    { id: 'k10', c: 'crime', w: 5, type: 'idea', title: 'Porfiry\'s method', text: 'The investigator rarely accuses. He talks, digresses, lets silence work. He bets that a conscience left alone with itself will do the detective\'s job.', themes: ['conscience', 'justice'] },
    { id: 'k11', c: 'crime', w: 6, type: 'idea', title: 'The dark double', text: 'Svidrigailov seems to live with no conscience at all. Dostoevsky places him beside Raskolnikov like a mirror: this is where your theory leads.', themes: ['conscience', 'freedom'] },
    { id: 'k12', c: 'crime', w: 7, type: 'art', art: 'candle', title: 'Lazarus, by candlelight', text: 'A murderer and a prostitute read of a man raised from the dead.' },
    { id: 'k13', c: 'crime', w: 7, type: 'question', title: 'Why Lazarus?', text: 'Of every Gospel story, Sonya reads the raising of Lazarus. What would it mean for Raskolnikov to be "raised" — and what has died in him?', themes: ['redemption'] },
    { id: 'k14', c: 'crime', w: 11, type: 'idea', title: 'Neat, or the whole point?', text: 'Many critics find the Epilogue too tidy. Others argue the entire novel exists for its final pages. Your reading of the ending is a reading of the book.', themes: ['redemption', 'forgiveness'] },

    /* ---------------- The Count of Monte Cristo ---------------- */
    { id: 'm1', c: 'monte', w: 0, type: 'fact', title: 'A newspaper sensation', text: 'The novel was serialised in the Journal des Débats between 1844 and 1846. Readers across Europe followed each instalment.' },
    { id: 'm2', c: 'monte', w: 0, type: 'fact', title: 'The collaborator', text: 'Dumas wrote the novel with Auguste Maquet, who is credited with suggesting much of the opening section. How to share credit between them is still argued over.' },
    { id: 'm3', c: 'monte', w: 0, type: 'fact', title: 'The real Black Count', text: 'Dumas\'s father, General Thomas-Alexandre Dumas, born in Saint-Domingue to a French nobleman and an enslaved woman, was imprisoned for two years in Italy. Tom Reiss\'s biography The Black Count (2012) argues he inspired the novel.' },
    { id: 'm4', c: 'monte', w: 0, type: 'fact', title: 'A case from the police files', text: 'Dumas drew on a story in Jacques Peuchet\'s collection of Paris police archives: a shoemaker, François Picaud, wrongly imprisoned after a jealous denunciation.' },
    { id: 'm5', c: 'monte', w: 1, type: 'fact', title: 'The Château d\'If', text: 'The fortress is real: built in the 1520s on a small island off Marseille, it later served as a state prison. Today visitors can see a cell named after the fictional Dantès.' },
    { id: 'm6', c: 'monte', w: 1, type: 'art', art: 'island', title: 'Château d\'If', text: 'A rock, a fortress, and a long imprisonment.' },
    { id: 'm7', c: 'monte', w: 1, type: 'idea', title: 'The prison university', text: 'In prison, Dantès gains a teacher who gives him languages, science and history. Liberation of the mind comes before liberation of the body.', themes: ['redemption'] },
    { id: 'm8', c: 'monte', w: 2, type: 'fact', title: 'Montecristo is real', text: 'Montecristo is a small granite island in the Tuscan Archipelago, between Corsica and the Italian coast — today a protected nature reserve.' },
    { id: 'm9', c: 'monte', w: 3, type: 'fact', title: 'Dumas\'s own château', text: 'Success let Dumas build a lavish house near Paris that he named the Château de Monte-Cristo. Debts soon forced him to sell it.' },
    { id: 'm10', c: 'monte', w: 5, type: 'idea', title: 'He reveals more than he creates', text: 'Watch how the Count rarely invents new evil. He sets up situations where his enemies\' own greed, pride and fear finish the work.', themes: ['justice', 'responsibility'] },
    { id: 'm11', c: 'monte', w: 7, type: 'question', title: 'Justice or vengeance?', text: 'Where exactly is the line? Is it who suffers, how much, or who has the right to decide?', themes: ['justice', 'forgiveness'] },
    { id: 'm12', c: 'monte', w: 11, type: 'quote', text: 'Until the day when God shall deign to reveal the future to man, all human wisdom is contained in these two words, — "Wait and hope."', by: MC1846, themes: ['redemption'] },
    { id: 'm13', c: 'monte', w: 11, type: 'quote', text: 'There is neither happiness nor misery in the world; there is only the comparison of one state with another, nothing more.', by: MC1846, themes: ['suffering'] },
    { id: 'm14', c: 'monte', w: 11, type: 'art', art: 'stars', title: 'Wait and hope', text: 'Attendre et espérer.' },

    /* ---------------- Bible ---------------- */
    { id: 'b1', c: 'bible', w: 0, type: 'quote', text: 'The fear of the Lord is the beginning of wisdom. Fools despise wisdom and instruction.', by: DR + ' · Proverbs 1:7', themes: ['responsibility'] },
    { id: 'b2', c: 'bible', w: 0, type: 'word', word: 'חָכְמָה', translit: 'chokmáh', title: 'Wisdom', text: 'In Hebrew, wisdom is skill — the same word describes a craftsman\'s know-how. Wisdom is living well as a practised art, not just knowing things.', themes: ['responsibility'] },
    { id: 'b3', c: 'bible', w: 0, type: 'fact', title: 'An English Catholic Bible', text: 'The Douay-Rheims was translated by English Catholic exiles: the New Testament at Rheims in 1582, the Old Testament at Douai in 1609–10. Bishop Challoner revised it in the 1750s.' },
    { id: 'b4', c: 'bible', w: 1, type: 'quote', text: 'Iron sharpeneth iron, so a man sharpeneth the countenance of his friend.', by: DR + ' · Proverbs 27:17', themes: ['responsibility'] },
    { id: 'b5', c: 'bible', w: 2, type: 'quote', text: 'Vanity of vanities, said Ecclesiastes: vanity of vanities, and all is vanity.', by: DR + ' · Ecclesiastes 1:2', themes: ['suffering'] },
    { id: 'b6', c: 'bible', w: 2, type: 'word', word: 'הֶבֶל', translit: 'hével', title: 'Vapour, breath', text: 'Usually translated "vanity". It means mist, breath — real, but impossible to grasp. It appears around 38 times in Ecclesiastes.', themes: ['suffering', 'freedom'] },
    { id: 'b7', c: 'bible', w: 2, type: 'fact', title: 'Who is "the Teacher"?', text: 'Ecclesiastes\' speaker calls himself Qoheleth — roughly "one who gathers an assembly". The Greek title, Ecclesiastes, carries the same idea.' },
    { id: 'b8', c: 'bible', w: 3, type: 'quote', text: 'All things have their season, and in their times all things pass under heaven.', by: DR + ' · Ecclesiastes 3:1', themes: ['suffering'] },
    { id: 'b9', c: 'bible', w: 3, type: 'art', art: 'tree', title: 'A time for everything', text: 'Seasons of effort, seasons of rest — including in a 12-week cycle.' },
    { id: 'b10', c: 'bible', w: 4, type: 'word', word: 'μετάνοια', translit: 'metánoia', title: 'Repentance', text: 'Literally "a change of mind" — a turning around. Not endless self-punishment, but a new direction.', themes: ['redemption', 'forgiveness', 'conscience'] },
    { id: 'b11', c: 'bible', w: 4, type: 'fact', title: 'Five sermons', text: 'Matthew organises Jesus\' teaching into five great discourses, beginning with the Sermon on the Mount — a structure many scholars link to the five books of Moses.' },
    { id: 'b12', c: 'bible', w: 5, type: 'quote', text: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.', by: DR + ' · Matthew 5:3', themes: ['redemption'] },
    { id: 'b13', c: 'bible', w: 5, type: 'art', art: 'path', title: 'The narrow gate', text: 'Two roads: one wide and easy, one narrow and demanding (Matthew 7).' },
    { id: 'b14', c: 'bible', w: 6, type: 'quote', text: 'Come to me, all you that labour, and are burdened, and I will refresh you.', by: DR + ' · Matthew 11:28', themes: ['forgiveness', 'suffering'] },
    { id: 'b15', c: 'bible', w: 7, type: 'quote', text: 'Jesus saith to him: I say not to thee, till seven times; but till seventy times seven times.', by: DR + ' · Matthew 18:22', themes: ['forgiveness'] },
    { id: 'b16', c: 'bible', w: 8, type: 'question', title: 'Two failures', text: 'Peter denies Jesus and weeps; Judas betrays him and despairs. Both failed. What made the difference in what happened next?', themes: ['forgiveness', 'redemption', 'conscience'] },
    { id: 'b17', c: 'bible', w: 9, type: 'quote', text: 'But be ye doers of the word, and not hearers only, deceiving your own selves.', by: DR + ' · James 1:22', themes: ['responsibility'] },
    { id: 'b18', c: 'bible', w: 9, type: 'fact', title: 'An "epistle of straw"', text: 'In his 1522 preface Martin Luther called James "an epistle of straw" compared with Paul\'s letters. The Catholic tradition has always read James and Romans together.' },
    { id: 'b19', c: 'bible', w: 10, type: 'quote', text: 'For the good which I will, I do not; but the evil which I will not, that I do.', by: DR + ' · Romans 7:19', themes: ['conscience'] },
    { id: 'b20', c: 'bible', w: 10, type: 'quote', text: 'There is now therefore no condemnation to them that are in Christ Jesus, who walk not according to the flesh.', by: DR + ' · Romans 8:1', themes: ['forgiveness', 'redemption'] },
    { id: 'b21', c: 'bible', w: 11, type: 'quote', text: 'Be not overcome by evil, but overcome evil by good.', by: DR + ' · Romans 12:21', themes: ['justice', 'forgiveness'] },

    /* ---------------- Cross-book & life ---------------- */
    { id: 'x1', c: 'life', type: 'quote', text: 'Thou madest us for Thyself, and our heart is restless, until it repose in Thee.', by: 'St Augustine, Confessions I.1 — trans. E. B. Pusey (1838)', themes: ['redemption'] },
    { id: 'x2', c: 'life', type: 'quote', text: 'The heart has its reasons, which reason does not know.', by: 'Blaise Pascal, Pensées — trans. W. F. Trotter (1910)', themes: ['conscience'] },
    { id: 'x3', c: 'life', type: 'quote', text: 'Above all, don\'t lie to yourself.', by: 'Dostoevsky, The Brothers Karamazov — trans. Constance Garnett (1912)', themes: ['conscience'] },
    { id: 'x4', c: 'life', type: 'fact', title: 'Five shapes, one neck', text: 'The CAGED system maps the whole fretboard using the five open-chord shapes C, A, G, E and D. Move them up the neck and any chord can be played in five places.' },
    { id: 'x5', c: 'life', type: 'fact', title: 'The metronome', text: 'Johann Maelzel patented the metronome in 1815. Beethoven was one of the first composers to add metronome markings to his scores.' },
    { id: 'x6', c: 'life', type: 'idea', title: 'Attention residue', text: 'Researcher Sophie Leroy (2009) found that when we switch tasks, part of our attention stays stuck on the last one. One hour of single-task focus is worth more than it looks.', themes: ['freedom'] },
    { id: 'x7', c: 'life', type: 'art', art: 'key', title: 'The Key', text: 'Unlock your potential — one ring at a time.' },
    { id: 'x8', c: 'odyssey', w: 0, type: 'question', title: 'Xenia this week', text: 'Where did you see real hospitality this week — given or received? Where did you play the suitor, taking without giving?', themes: ['justice'] },
    { id: 'x9', c: 'monte', w: 1, req: [['odyssey', 5]], type: 'idea', title: 'Back from the dead', text: 'Odysseus goes down among the dead and returns changed; Dantès is buried alive in stone and returns as someone else. Great stories of renewal pass through a kind of death.', themes: ['redemption', 'suffering'] },
    { id: 'x10', c: 'bible', w: 11, req: [['odyssey', 10], ['monte', 7]], type: 'idea', title: 'Who may repay?', text: 'Odysseus takes vengeance with a bow; the Count with a fortune. Romans 12 answers differently: "Revenge to me; I will repay, saith the Lord." Three answers to one question.', themes: ['justice', 'forgiveness'] },
    { id: 'x11', c: 'crime', w: 7, req: [['bible', 8]], type: 'idea', title: 'Tears or despair', text: 'Sonya urges confession and suffering accepted; Peter weeps and is restored. Raskolnikov stands between Peter and Judas — which way will he turn?', themes: ['redemption', 'conscience'] },
    { id: 'x12', c: 'econ', w: 0, req: [['odyssey', 5]], type: 'idea', title: 'Odysseus, economist', text: 'Tying yourself to the mast is a decision about incentives: change the cost of temptation before it arrives. Your padlocked apps are pure Sowell and pure Homer.', themes: ['freedom', 'responsibility'] },
  ];

  /* ---------------- original SVG art ---------------- */
  function rng(seed) { let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const wave = (y, amp, len, ph) => { let d = `M0 ${y}`; for (let x = 0; x <= 400; x += 10) d += ` L${x} ${(y + Math.sin((x / len) * Math.PI * 2 + ph) * amp).toFixed(1)}`; return d + ' L400 500 L0 500 Z'; };
  const ART = {
    sea: (r) => `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0f22"/><stop offset=".55" stop-color="#5c1a33"/><stop offset="1" stop-color="#d4a64a"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="270" cy="230" r="54" fill="#f0cf85" opacity=".9"/>${[0, 1, 2, 3, 4].map((i) => `<path d="${wave(300 + i * 40, 8 - i, 120 + i * 30, i * 1.3 + r() * 3)}" fill="${['#4a1530', '#3a1027', '#2b0b1f', '#1f0817', '#14050f'][i]}"/>`).join('')}<path d="M120 318 L150 250 L150 318 Z" fill="#f0cf85" opacity=".85"/><path d="M105 322 L170 322 L160 334 L115 334 Z" fill="#14050f"/>`,
    island: (r) => `<rect width="400" height="500" fill="#0b1426"/>${Array.from({ length: 40 }, () => `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 250).toFixed(0)}" r="${(r() * 1.4 + .3).toFixed(1)}" fill="#fff" opacity="${(r() * .7 + .2).toFixed(2)}"/>`).join('')}<circle cx="300" cy="90" r="30" fill="#e9e2cf"/><path d="M60 330 Q120 250 200 262 Q290 250 340 330 Z" fill="#2a3346"/><rect x="150" y="200" width="100" height="70" fill="#3b4660"/><rect x="140" y="180" width="30" height="90" fill="#46526e"/><rect x="230" y="180" width="30" height="90" fill="#46526e"/><rect x="190" y="225" width="18" height="24" fill="#d4a64a" opacity=".85"/>${[0, 1, 2].map((i) => `<path d="${wave(330 + i * 45, 5, 90, i + r() * 2)}" fill="${['#13213b', '#0f1a30', '#0b1426'][i]}"/>`).join('')}`,
    city: (r) => `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2783c"/><stop offset=".6" stop-color="#8a2f2b"/><stop offset="1" stop-color="#2a1018"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="200" r="70" fill="#ffcf7a" opacity=".55"/><path d="M0 300 L0 220 L40 220 L40 190 L70 190 L70 230 L110 230 L110 170 L125 150 L140 170 L140 240 L190 240 L190 200 L250 200 L250 160 Q265 120 280 160 L280 230 L330 230 L330 185 L360 185 L360 225 L400 225 L400 300 Z" fill="#2a1018"/><path d="M0 300 L400 300 L400 500 L0 500 Z" fill="#3b1620"/><path d="M60 300 Q200 210 340 300" fill="none" stroke="#1a0a10" stroke-width="16"/>${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${90 + i * 45}" x2="${90 + i * 45}" y1="${300 - Math.sin(((i + .5) / 6) * Math.PI) * 60}" y2="300" stroke="#1a0a10" stroke-width="5"/>`).join('')}${[0, 1, 2, 3].map((i) => `<path d="M${40 + r() * 300} ${330 + i * 40} h${60 + r() * 80}" stroke="#e2783c" stroke-width="3" opacity=".35" stroke-linecap="round"/>`).join('')}`,
    scales: () => `<rect width="400" height="500" fill="#14110a"/><circle cx="200" cy="250" r="170" fill="#d4a64a" opacity=".06"/><line x1="200" y1="110" x2="200" y2="400" stroke="#d4a64a" stroke-width="6"/><path d="M150 410 h100" stroke="#d4a64a" stroke-width="8" stroke-linecap="round"/><g transform="rotate(-8 200 140)"><line x1="70" y1="140" x2="330" y2="140" stroke="#f0cf85" stroke-width="6" stroke-linecap="round"/><path d="M70 140 L40 240 M70 140 L100 240" stroke="#d4a64a" stroke-width="2"/><path d="M30 240 Q70 275 110 240 Z" fill="#d4a64a"/><path d="M330 140 L300 240 M330 140 L360 240" stroke="#d4a64a" stroke-width="2"/><path d="M290 240 Q330 275 370 240 Z" fill="#d4a64a"/>${[0, 1, 2].map((i) => `<circle cx="${55 + i * 15}" cy="${232 - (i % 2) * 6}" r="9" fill="#f0cf85" stroke="#14110a"/>`).join('')}${[0, 1, 2, 3].map((i) => `<path d="M${312 + i * 6} 236 l0 -40" stroke="#f0cf85" stroke-width="3"/>`).join('')}</g><circle cx="200" cy="110" r="10" fill="#f0cf85"/>`,
    loom: (r) => `<rect width="400" height="500" fill="#1b1422"/>${Array.from({ length: 22 }, (_, i) => `<line x1="${40 + i * 15}" y1="60" x2="${40 + i * 15}" y2="440" stroke="#c9a96e" stroke-width="2" opacity=".7"/>`).join('')}${Array.from({ length: 14 }, (_, j) => `<path d="M40 ${80 + j * 14} h${315 - (j > 9 ? (j - 9) * 60 : 0)}" stroke="${['#7a2e44', '#a6435c', '#d4a64a'][j % 3]}" stroke-width="10"/>`).join('')}${Array.from({ length: 7 }, (_, k) => `<path d="M${130 + r() * 200} 300 q ${-20 + r() * 40} 60 ${-10 + r() * 20} 130" stroke="#a6435c" stroke-width="3" fill="none" opacity=".7"/>`).join('')}<rect x="30" y="50" width="340" height="12" rx="6" fill="#6b4c2e"/><rect x="30" y="438" width="340" height="12" rx="6" fill="#6b4c2e"/>`,
    bow: () => `<rect width="400" height="500" fill="#101623"/>${Array.from({ length: 12 }, (_, i) => `<g transform="translate(${32 + i * 30} 300)"><rect x="-2" y="0" width="4" height="70" fill="#5a4630"/><path d="M-12 0 L12 0 L10 -26 L-10 -26 Z" fill="#9aa3b8"/><circle cx="0" cy="-13" r="5" fill="#101623"/></g>`).join('')}<path d="M40 288 L370 288" stroke="#f0cf85" stroke-width="2" stroke-dasharray="6 6"/><path d="M370 288 l-14 -6 l0 12 Z" fill="#f0cf85"/><path d="M60 120 Q200 30 340 120" fill="none" stroke="#d4a64a" stroke-width="10" stroke-linecap="round"/><line x1="60" y1="120" x2="340" y2="120" stroke="#e9e2cf" stroke-width="1.5"/>`,
    candle: () => `<defs><radialGradient id="g" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#f0cf85" stop-opacity=".55"/><stop offset=".5" stop-color="#7a4a1e" stop-opacity=".2"/><stop offset="1" stop-color="#0a0a0f" stop-opacity="0"/></radialGradient></defs><rect width="400" height="500" fill="#0a0a0f"/><rect width="400" height="500" fill="url(#g)"/><rect x="185" y="220" width="30" height="110" rx="4" fill="#e9e2cf"/><path d="M200 160 Q214 190 200 215 Q186 190 200 160 Z" fill="#ffd27a"/><path d="M200 182 Q206 196 200 210 Q194 196 200 182 Z" fill="#fff4d6"/><path d="M80 380 Q140 350 200 372 Q260 350 320 380 L320 400 Q260 372 200 394 Q140 372 80 400 Z" fill="#c9b48a"/><line x1="200" y1="372" x2="200" y2="394" stroke="#7a6a4a" stroke-width="2"/>${[0, 1, 2, 3].map((i) => `<path d="M${100 + i * 6} ${374 - i * 2 + 6} q40 -14 85 0" stroke="#7a6a4a" stroke-width="1.2" fill="none"/><path d="M${215 + i * 6} ${374 - i * 2 + 6} q40 -14 85 0" stroke="#7a6a4a" stroke-width="1.2" fill="none"/>`).join('')}`,
    tree: () => `<rect width="400" height="500" fill="#0f1814"/><path d="M196 460 L196 300 Q190 250 160 220 M204 460 L204 300 Q212 250 240 220 M200 330 Q170 300 130 290 M200 330 Q232 300 272 292" stroke="#5a4630" stroke-width="10" fill="none" stroke-linecap="round"/>${[['#9ecf7a', 140, 170], ['#4fae8a', 260, 170], ['#d4a64a', 135, 270], ['#e9e2cf', 265, 270]].map(([c, x, y]) => `<circle cx="${x}" cy="${y}" r="62" fill="${c}" opacity=".85"/>`).join('')}<line x1="200" y1="90" x2="200" y2="340" stroke="#0f1814" stroke-width="3"/><line x1="60" y1="222" x2="340" y2="222" stroke="#0f1814" stroke-width="3"/><path d="M0 460 h400" stroke="#2a3a30" stroke-width="40"/>`,
    path: () => `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a3c"/><stop offset="1" stop-color="#0d1420"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="290" cy="110" r="36" fill="#f0cf85" opacity=".9"/><path d="M0 500 L150 230 L210 230 L360 500 Z" fill="#2a3346"/><path d="M290 500 L300 230 L312 230 L330 500 Z" fill="#d4a64a" opacity=".85"/><rect x="292" y="190" width="6" height="50" fill="#e9e2cf"/><rect x="314" y="190" width="6" height="50" fill="#e9e2cf"/><path d="M290 190 h32" stroke="#e9e2cf" stroke-width="5"/><path d="M110 240 h140" stroke="#4a5570" stroke-width="3"/>`,
    stars: (r) => `<rect width="400" height="500" fill="#070b18"/>${Array.from({ length: 90 }, () => `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 330).toFixed(0)}" r="${(r() * 1.6 + .2).toFixed(1)}" fill="#fff" opacity="${(r() * .8 + .15).toFixed(2)}"/>`).join('')}<path d="M0 360 h400 v140 h-400 Z" fill="#0d1630"/><path d="${wave(370, 3, 70, 1)}" fill="#0b1328"/><path d="M200 340 L216 362 L184 362 Z" fill="#f0cf85"/><path d="M178 362 h44 l-6 10 h-32 Z" fill="#1b2540"/><circle cx="200" cy="380" r="40" fill="#f0cf85" opacity=".08"/>`,
    key: () => `<rect width="400" height="500" fill="#111814"/>${[150, 120, 90].map((rr, i) => `<circle cx="200" cy="250" r="${rr}" fill="none" stroke="${['#ff6b5e', '#4aa8ff', '#4fd18b'][i]}" stroke-width="14" stroke-opacity=".85" stroke-dasharray="${2 * Math.PI * rr * [0.82, 0.64, 0.9][i]} 999" stroke-linecap="round" transform="rotate(-90 200 250)"/>`).join('')}<circle cx="168" cy="250" r="26" fill="none" stroke="#d4a64a" stroke-width="10"/><path d="M194 250 h52 M232 250 v14 M246 250 v10" stroke="#d4a64a" stroke-width="10" stroke-linecap="round"/>`,
  };
  function art(scene, id) { const f = ART[scene] || ART.key; return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${f(rng(id || scene))}</svg>`; }

  /* ---------------- personalisation ---------------- */
  function visible(card, T) {
    if (card.c !== 'life' && !T.unlocked(card.c, card.w || 0)) return false;
    if (card.req && !card.req.every(([c, w]) => T.unlocked(c, w))) return false;
    return true;
  }
  function currentWeek(S, T, cid) {
    const c = T.course(cid); if (!c) return 0;
    const i = c.weeks.findIndex((_, j) => !(S.study.progress[T.modKey(cid, j)] || {}).read);
    return i < 0 ? 11 : i;
  }
  function affinity(S) {
    const a = { c: {}, type: {}, theme: {} };
    for (const id of Object.keys(S.discover.likes)) {
      const k = C.find((x) => x.id === id); if (!k) continue;
      a.c[k.c] = (a.c[k.c] || 0) + 1; a.type[k.type] = (a.type[k.type] || 0) + 1;
      for (const t of k.themes || []) a.theme[t] = (a.theme[t] || 0) + 1;
    }
    for (const id of Object.keys(S.discover.hidden)) { const k = C.find((x) => x.id === id); if (k) a.type[k.type] = (a.type[k.type] || 0) - 0.5; }
    return a;
  }
  function score(card, S, T, aff, r) {
    let s = 2;
    if (card.c !== 'life') { const cur = currentWeek(S, T, card.c); const d = Math.abs((card.w || 0) - cur); s += 3 - Math.min(d, 3) * 0.9; }
    else s += 0.8;
    s += (aff.c[card.c] || 0) * 0.35 + (aff.type[card.type] || 0) * 0.25 + (card.themes || []).reduce((a, t) => a + (aff.theme[t] || 0) * 0.2, 0);
    s -= (S.discover.seen[card.id] || 0) * 1.1;
    if (S.discover.saved[card.id]) s -= 1;
    return s + r() * 1.8;
  }
  const DECK_SIZE = 18;
  function dailyDeck(S, T, date) {
    const D = S.discover;
    if (D.deck && D.deck.date === date && D.deck.ids.every((id) => C.some((x) => x.id === id))) return D.deck.ids;
    const r = rng('deck' + date), aff = affinity(S);
    const pool = C.filter((k) => visible(k, T) && !D.hidden[k.id]).map((k) => ({ k, s: score(k, S, T, aff, r) })).sort((a, b) => b.s - a.s);
    // light variety: avoid the same course or type twice in a row where possible
    const out = []; const rest = [...pool];
    while (out.length < DECK_SIZE && rest.length) {
      const prev = out[out.length - 1];
      let i = rest.findIndex((x) => !prev || (x.k.c !== prev.k.c && x.k.type !== prev.k.type));
      if (i < 0) i = 0;
      out.push(rest.splice(i, 1)[0]);
    }
    D.deck = { date, ids: out.map((x) => x.k.id) };
    return D.deck.ids;
  }

  window.TK_DISCOVER = { cards: C, art, visible, dailyDeck, byId: (id) => C.find((x) => x.id === id), DECK_SIZE };
})();
