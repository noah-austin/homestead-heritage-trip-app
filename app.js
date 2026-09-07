/* HomesteadOS — one family's day, over-engineered on purpose.
   No server. No analytics. No framework. Everything lives in localStorage,
   and phones sync by texting each other a link. */

(function () {
  'use strict';

  const VERSION = '1.4.0';
  const STORE_KEY = 'homesteados.v1';

  /* ------------------------------------------------------------------
     Content
     ------------------------------------------------------------------ */

  // Everything hangs off the café reservation. Waffles are dessert, on the way out.
  const RESERVATIONS = ['11:00', '11:30', '12:00'];
  const WAFFLES_AT = 13 * 60 + 45;   // seated by 1:45; Waco Waffle's kitchen closes at 2:30
  const LEAVE_BY = 15 * 60;          // gone by 3:00
  const LUNCH_MIN = 60;              // a sit-down lunch for four
  const DRIVE_MIN = 135;             // Kyle to Elm Mott, about 2¼ hours
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')}`;
  const reservation = () => (S.resv && S.resv.t) || '12:00';
  const exploreWindow = () => WAFFLES_AT - (toMin(reservation()) + LUNCH_MIN);

  function buildStops() {
    const R = toMin(reservation());
    return [
      { id: 'pickup', time: fmt(R - 180), title: 'Austins collect the Martins',
        body: 'Noah and Jill pick up Blake and Megan. Bathroom before, not after. Water bottles. Charged phones; this app has needs.' },
      { id: 'coffee', time: fmt(R - 160), title: 'Summer Moon, Kyle',
        body: '4217 Benner Rd #400, Kyle. Wood‑fired coffee and Moon Milk, which is sweet cream with a cult following. Order for the car; the drive is long.',
        link: { label: 'Open Summer Moon in Maps', href: 'https://www.google.com/maps/search/?api=1&query=Summer+Moon+Coffee+4217+Benner+Rd+Kyle+TX+78640' } },
      { id: 'drive', time: fmt(R - 140), sub: 'about 2¼ hours', title: 'The Drive',
        body: `I‑35 north the whole way: through Austin, past Temple, past Waco. Arrive about ${fmt(R - 5)} for the ${fmt(R)} table. Assign a DJ. Argue about the DJ.`,
        directions: [
          'Take I‑35 north to exit 343 (Elm Mott, FM 308).',
          'Go west on FM 308 for 3.1 miles to the flashing light at FM 933.',
          'Turn right (north) on FM 933 for 1.6 miles.',
          'Turn left on Halbert Lane and follow it through the Brazos de Dios entrance.',
        ],
        map: true },
      { id: 'lunch', time: fmt(R), sub: 'reservation, table for four', title: 'Lunch at Café Homestead',
        body: 'Farm to table since 1994: pasture‑raised beef, their own bread and cheese, house‑made everything. Ask about the pie now and order it later at the waffle house instead; that is called pacing.',
        resv: true },
      { id: 'explore', time: fmt(R + LUNCH_MIN), sub: `until ${fmt(WAFFLES_AT)}`, title: 'Explore',
        body: 'This is the open part of the day. Pick what sounds good; the app adds up the minutes and tells you whether you are being realistic.',
        options: true },
      { id: 'waffles', time: fmt(WAFFLES_AT), sub: 'kitchen closes at 2:30', title: 'Waffles at Waco Waffle Co.',
        body: 'Dessert, on the way out. 224 Halbert Ln, still on the grounds, in a restored 1700s timber‑frame house with its own water wheel. Sweet: the University (peanut butter, banana, chocolate, caramel) or the Webster (strawberries, Nutella, cream). Savory, if lunch was somehow insufficient: the Silo.',
        link: { label: 'Waco Waffle menu', href: 'https://www.wacowaffle.com/' } },
      { id: 'home', time: fmt(LEAVE_BY), sub: 'hard stop', title: 'Homeward',
        body: 'Gone by three. Reverse the directions, argue about the DJ again. The Trip Report generates itself under More. Someone will nap in the car (−1).' },
    ];
  }
  let STOPS = [];   // filled once state is loaded (see below)

  const EXPLORE = [
    { id: 'gristmill', name: 'Homestead Gristmill', min: 30, note: 'Watch the c. 1760 mill grind; samples in the store.' },
    { id: 'teahouse', name: 'Tea House & cider mill', min: 20, note: 'Inside the Gristmill. Cider, tea, a sit‑down.' },
    { id: 'pottery', name: 'The Potter’s House', min: 20, note: 'Wheel demonstrations when the potter is at it.' },
    { id: 'wood', name: 'Woodworking shop', min: 20, note: 'Hand‑cut joinery and the furniture showroom.' },
    { id: 'forge', name: 'The Forge', min: 20, note: 'Blacksmithing. Stand back, then lean in.' },
    { id: 'fiber', name: 'Fiber crafts', min: 15, note: 'Spinning, weaving, quilting.' },
    { id: 'basket', name: 'Basketry', min: 15, note: 'Woven by hand, held together by patience.' },
    { id: 'cheese', name: 'Cheese', min: 15, note: 'Award‑winning, sampled, judged.' },
    { id: 'giftbarn', name: 'Gift Barn', min: 20, note: 'Where resolve goes to be tested.' },
    { id: 'grounds', name: 'Grounds, barn & animals', min: 30, note: 'The 200‑year‑old barn and whatever is grazing.' },
    { id: 'herbs', name: 'Herb garden', min: 10, note: 'A quiet loop. Smell things.' },
  ];

  const BINGO_POOL = [
    'Someone in a bonnet or suspenders',
    'Somebody asks how much the rocking chair costs',
    'Someone says “we should just live like this”',
    'You smell bread before you see it',
    'The potter makes it look easy',
    'A goat, sheep, or cow stares directly at you',
    '“Is this Amish?” gets asked',
    'Someone photographs a fence',
    'Someone takes a sample twice',
    'Someone asks if the gristmill is actually running',
    'Someone buys cheese',
    'A quilt gets touched that should not be',
    'A rooster crows at a dramatic moment',
    'The blacksmith strikes; everyone flinches',
    '“That would be a great picture.” No picture is taken',
    'Noah mentions the app, unprompted',
    'Someone asks about lunch before 11:00',
    'Pie ordered “to share” is not shared',
    'Someone reads a placard aloud to the group',
    'A horse or a wagon appears',
    'Someone says “hand‑made” with reverence',
    'Sawdust on someone’s clothes',
    'Someone says “I could make that”',
    'Someone cannot, in fact, make that',
    'A stranger compliments the family',
    'Someone gets lost between two buildings',
    'Someone touches the water wheel',
    'A barefoot child (theirs, not ours)',
    'Someone mispronounces Elm Mott',
    'A purchase is justified as “an investment”',
    'Someone asks if we can go in the barn',
    'Someone naps in the car',
    'Cider is described as “dangerous”',
    'A theological question is raised at lunch',
    'Someone tries to pet something that walks away',
    'Someone finds the restroom without the app',
    'Someone says “heritage” unironically',
    'The Martins and the Austins split up and reunite at the café',
    'Someone asks the price of a whole wheel of cheese',
    'A phone dies before 2 pm',
    '“We should come back for the fair”',
    'Someone learns what a gristmill actually does',
    'Someone says “this is so much better than a screen”',
    'Someone orders Moon Milk and regrets nothing',
    'Someone orders the Silo and cannot finish it',
    'Someone photographs the waffle before eating it',
    'Blake asks the blacksmith a question',
    'Megan photographs something nobody else noticed',
    'Jill says “we should get one of these”',
    'Someone says the app was made “for everything”',
    'Someone is still holding a Summer Moon cup at the gristmill',
  ];

  const PRESETS = [
    { id: 'question', label: 'Asked the artisan a good question', pts: 5 },
    { id: 'resist', label: 'Resisted a purchase', pts: 3 },
    { id: 'buy', label: 'Made a purchase (supporting the local economy)', pts: 2 },
    { id: 'pet', label: 'Petted an animal', pts: 2 },
    { id: 'pie', label: 'Ate pie', pts: 4 },
    { id: 'verse', label: 'Quoted Scripture relevantly', pts: 3 },
    { id: 'word', label: 'Learned a craft word (e.g. “millstone dressing”)', pts: 2 },
    { id: 'more', label: 'Said “we should do this more”', pts: 1 },
    { id: 'wrong', label: 'Caught the app being wrong', pts: 1 },
    { id: 'heat', label: 'Complained about the heat', pts: -2 },
    { id: 'email', label: 'Checked work email', pts: -5 },
    { id: 'nap', label: 'Fell asleep in the car', pts: -1 },
  ];

  const SHOPS = [
    { id: 'gristmill', name: 'Homestead Gristmill', note: 'c. 1760 timber‑frame mill; cider mill and tea room inside.',
      notice: 'The two stones never touch. The miller sets the gap by hand, and the furrows cut into the stone faces carry the meal outward as the runner turns. Listen for the pitch of the stones to change when the grain runs low.',
      ask: ['How often do you dress, meaning re‑cut, the stones?', 'What does stone‑ground actually change about the flour?'] },
    { id: 'pottery', name: 'The Potter’s House', note: 'Wheel‑thrown stoneware. It looks easy. It is not.',
      notice: 'Watch centering: the potter’s hands barely move and the clay does all the moving. On finished pieces, turn one over and look at the trimmed foot ring. Glaze color comes from minerals and from what the kiln atmosphere does to them.',
      ask: ['Where does your clay come from?', 'How many pieces do you lose to the kiln?'] },
    { id: 'wood', name: 'Woodworking Shop', note: 'Hand‑cut joinery and the furniture showroom.',
      notice: 'Hand‑cut dovetails have thin pins and slightly uneven spacing; machine‑cut ones are perfectly uniform. Look for faint hand‑plane tracks on flat surfaces, and pull a drawer to feel how it runs.',
      ask: ['Which joint takes longest to learn?', 'How long does a chair take, start to finish?'] },
    { id: 'forge', name: 'The Forge', note: 'Blacksmithing. Stand back, then lean in.',
      notice: 'Color is temperature. Dull red is too cold to move much; bright orange into yellow is working heat. The hammer blows are placed, not just hard, and the smith reads the steel between each one.',
      ask: ['What is the hardest thing you make?', 'How do you know the steel is ready?'] },
    { id: 'fiber', name: 'Fiber Crafts', note: 'Spinning, weaving, quilting.',
      notice: 'In spinning, the fiber is drafted, meaning drawn out thin, a moment before the twist locks it. On a loom, the warp threads carry the tension and the weft carries the pattern. Quilts: look at the stitch length on the back.',
      ask: ['How long does a yard of cloth take?', 'What breed of sheep did this come from?'] },
    { id: 'basket', name: 'Basketry', note: 'Woven by hand, held together by patience.',
      notice: 'Everything starts at the base. Look for the moment the weavers turn up to form the sides, and for the rim, which holds the whole thing together. White oak splints are often split by hand along the grain.',
      ask: ['How long does the oak soak before you can work it?', 'Which shape is the hardest to get right?'] },
    { id: 'cheese', name: 'Cheese', note: 'Award‑winning, sampled, judged.',
      notice: 'Aged cheeses grow a natural rind and their flavor concentrates with time. Taste the young and the aged version of the same cheese back to back if they have both out.',
      ask: ['How long is this one aged?', 'Which one would you take home?'] },
    { id: 'waffle', name: 'Waco Waffle Co.', note: 'Waffles in a timber‑frame house. Rate the waffle, not the house.',
      notice: 'The building is a restored eighteenth‑century timber frame: pegged joints, no nails. The water wheel outside is the same technology as the gristmill, in miniature.',
      ask: ['Which waffle do you make the most of?', 'Which one do the staff actually eat?'] },
    { id: 'cafe', name: 'Café Homestead', note: 'Lunch. Pie. The rating that ends friendships.',
      notice: 'The bread, cheese, and much of the produce come from a few hundred yards away. Ask what is from the farm today.',
      ask: ['What came off the farm this morning?', 'What should four people share?'] },
    { id: 'giftbarn', name: 'Gift Barn', note: 'Where resolve goes to be tested.',
      notice: 'Sort made‑here from bought‑in. Look for a maker’s mark on the bottom of pottery and the underside of woodwork.',
      ask: ['Who made this one?', 'What sells out first at the fair?'] },
    { id: 'grounds', name: 'Grounds & Animals', note: 'The barn, the fields, whatever stared at you.',
      notice: 'The big barn is timber‑framed: look up at the pegged mortise‑and‑tenon joints holding the beams. No nails in the frame.',
      ask: ['How old is the barn, and where did it come from?', 'What is the farm growing right now?'] },
  ];

  const PREDICTIONS = [
    { id: 'top', q: 'Highest‑rated stop of the day', type: 'shop' },
    { id: 'first', q: 'Who buys the first thing', type: 'player' },
    { id: 'count', q: 'Total purchases, all four of us', type: 'number', options: ['0', '1', '2', '3', '4', '5', '6+'] },
    { id: 'amish', q: 'Does anyone ask “Is this Amish?”', type: 'yesno' },
    { id: 'late', q: 'How late does the day run', type: 'choice', options: ['On time', '1–15 min', '16–30 min', '31–60 min', 'Don’t ask'] },
    { id: 'photos', q: 'Who takes the most photos', type: 'player' },
    { id: 'return', q: 'First to say “we should come back”', type: 'player' },
  ];
  const PRED_POINTS = 5;

  const SUPERLATIVES = [
    { id: 'purchase', name: 'Best Purchase' },
    { id: 'question', name: 'Best Question Asked an Artisan' },
    { id: 'move', name: 'Most Likely to Move Here' },
    { id: 'waffle', name: 'Best Waffle Order' },
    { id: 'mvp', name: 'MVP of the Day' },
  ];
  const SUP_POINTS = 5;

  const ROAD_QUESTIONS = [
    'Which of their crafts would you actually learn if you had a year?',
    'What smell do you expect to hit first when we get out of the car?',
    'What would you give up for a slower week? What wouldn’t you?',
    'One thing you’d buy today if money were no object. One thing you’d buy if it were.',
    'Sabbath: a rule, a gift, or a relic? Has your answer changed in the last five years?',
    'Rank them: bread, cheese, pie, waffle. Defend the ranking.',
    'Is craftsmanship a form of worship, or just work done well? Is there a difference?',
    'Who in this car would last longest on a homestead, and why is it not you?',
    'Communities like this one choose to live apart. What do they gain? What do they risk?',
    'Name something you made with your hands that you’re still proud of.',
    'Simplicity: is it owning less, or wanting less?',
    'Is technology neutral? Name one tool that has made you worse at something.',
    'If our household made one thing from scratch every week, what should it be?',
    'Which tradition from your grandparents would you keep if you could keep only one?',
    'Who taught you a skill patiently? What did that patience feel like?',
    'What is one question you actually want to ask an artisan today?',
    'How far back can you trace one thing you ate for breakfast?',
    'What would a good day look like if nothing about it could be posted?',
    'Predict the first full sentence someone says when we get out of the car.',
    'What are you hoping happens today that you haven’t said out loud?',
  ];

  const BOOT_LINES = [
    'Loading parchment…',
    'Warming up the gristmill (water‑powered, please wait)…',
    'Requesting location permission… denied. It’s Texas.',
    'Mounting /family with option “patience”…',
    'Syncing calendar: 1 event (“Homestead Heritage”)…',
    'Checking for updates… none. Nobody asked for this.',
    'Fetching pie inventory… unknowable.',
    'HomesteadOS ready.',
  ];

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */

  const emptyState = () => ({
    v: 1,
    players: [],              // [{id, name}]
    active: null,             // active player id on this phone
    bingo: {},                // playerId -> [cellIdx...]
    events: [],               // [{id, player, label, points, ts}]
    ratings: {},              // playerId -> shopId -> {n, ts}
    notes: {},                // stopId -> {text, ts}
    done: [],                 // stop ids completed
    plan: [],                 // legacy; superseded by picks
    picks: {},                // optId -> {on, ts}
    deleted: [],              // tombstoned event ids (so deletes survive merges)
    resv: null,               // {t: '12:00', ts}
    preds: {},                // playerId -> predId -> {v, ts}
    actuals: {},              // predId -> {v, ts}  (group-settled answers)
    votes: {},                // supId -> voterId -> {p, ts}
    doneAt: {},               // stopId -> ts when marked done
    roadIdx: 0,               // where the road-questions deck is
    now: 'pickup',            // current stop
    settings: { sabbath: true, haptics: true, push: false },
    setup: false,
  });

  let S = load();
  (S.plan || []).forEach((id) => { if (!S.picks[id]) S.picks[id] = { on: true, ts: 0 }; });
  S.plan = [];
  STOPS = buildStops();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(emptyState(), JSON.parse(raw));
    } catch (e) { /* fall through */ }
    return emptyState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* private mode, etc. */ }
    roomDirty();
  }

  const HOUSEHOLDS = { Austins: ['noah', 'jill'], Martins: ['blake', 'megan'] };
  function householdTotals(board) {
    return Object.entries(HOUSEHOLDS).map(([name, ids]) => ({
      name, pts: board.filter((r) => ids.includes(r.p.id)).reduce((a, r) => a + r.pts, 0),
      present: board.some((r) => ids.includes(r.p.id)),
    })).filter((h) => h.present);
  }

  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'p';
  const player = (id) => S.players.find((p) => p.id === id);
  const activePlayer = () => player(S.active) || S.players[0] || null;

  /* ------------------------------------------------------------------
     DOM helpers
     ------------------------------------------------------------------ */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function h(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content;
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
    if (S.settings.haptics && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
  }

  function openModal(html, onOpen) {
    const m = $('#modal');
    $('#modalBody').innerHTML = html;
    if (typeof m.showModal === 'function') m.showModal(); else m.setAttribute('open', '');
    if (onOpen) onOpen($('#modalBody'));
  }
  function closeModal() {
    const m = $('#modal');
    if (m.open) m.close(); else m.removeAttribute('open');
  }
  $('#modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  /* ------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------ */

  function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  $('#themeBtn').addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('homesteados.theme', next); } catch (e) {}
    toast(next === 'dark' ? 'Candlelight mode' : 'Daylight mode');
  });

  /* ------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------ */

  const renderers = { day: renderDay, bingo: renderBingo, score: renderScore, rate: renderRate, predict: renderPredict, road: renderRoad, more: renderMore };
  let currentView = 'day';

  function show(view) {
    currentView = view;
    $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + view; });
    $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.view === view));
    renderers[view]();
    window.scrollTo({ top: 0 });
  }
  $$('.tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.view)));
  function rerender() { renderers[currentView](); }

  /* ------------------------------------------------------------------
     Player chips (shared by Bingo / Score / Rate)
     ------------------------------------------------------------------ */

  function playerChips() {
    if (!S.players.length) return '';
    return `<div class="chips" data-chips>${S.players.map((p) =>
      `<button type="button" class="chip ${p.id === (activePlayer() || {}).id ? 'is-active' : ''}" data-player="${esc(p.id)}">${esc(p.name)}</button>`
    ).join('')}</div>`;
  }
  function bindChips(root) {
    $$('[data-player]', root).forEach((b) => b.addEventListener('click', () => {
      S.active = b.dataset.player; save(); rerender();
    }));
  }
  function needPlayers(root) {
    if (S.players.length) return false;
    root.innerHTML += `<div class="card"><p>Nobody is on this trip yet, which seems wrong.</p>
      <button type="button" class="btn primary" data-setup>Add the family</button></div>`;
    $('[data-setup]', root).addEventListener('click', () => setupPlayers());
    return true;
  }

  /* ------------------------------------------------------------------
     Day view
     ------------------------------------------------------------------ */

  function routeStrip() {
    // The pilgrim's road: I-35 from Kyle to Elm Mott, as a manuscript would draw it.
    const towns = [
      { x: 30, n: 'Kyle', s: 'coffee' }, { x: 120, n: 'Austin' }, { x: 210, n: 'Round Rock' },
      { x: 320, n: 'Temple' }, { x: 430, n: 'Waco' }, { x: 520, n: 'Elm Mott', s: 'exit 343' },
    ];
    return `<svg class="route" viewBox="0 0 560 84" role="img" aria-label="Route along I‑35 from Kyle to Elm Mott">
      <path class="road" d="M 30 40 C 90 30, 150 50, 210 40 S 330 30, 430 40 S 500 46, 530 40" />
      <text class="hwy" x="270" y="28" text-anchor="middle">I‑35 north · about 2¼ hours</text>
      ${towns.map((t) => `<circle class="town ${t.n === 'Elm Mott' ? 'dest' : ''}" cx="${t.x}" cy="40" r="${t.n === 'Elm Mott' ? 6 : 4}" />
        <text x="${t.x}" y="64" text-anchor="middle">${t.n}</text>
        ${t.s ? `<text class="sub" x="${t.x}" y="79" text-anchor="middle">${t.s}</text>` : ''}`).join('')}
    </svg>`;
  }

  // Ephemeral Day-view UI state (not persisted, not synced).
  let openStop = null;      // expanded timeline row
  let editingNote = null;   // stop id whose note editor is open

  const picked = (id) => !!((S.picks[id] || {}).on);
  const pickedIds = () => EXPLORE.filter((o) => picked(o.id)).map((o) => o.id);
  function exploreVerdict() {
    const W = exploreWindow();
    const planMin = EXPLORE.filter((o) => picked(o.id)).reduce((a, o) => a + o.min, 0);
    if (!pickedIds().length) return `${W} minutes to fill. Nothing picked yet; the gristmill is the safe first choice.`;
    if (planMin <= W - 20) return `${planMin} of ${W} minutes spoken for. Comfortable. Add something.`;
    if (planMin <= W) return `${planMin} of ${W} minutes spoken for. Tight but honest.`;
    return `${planMin} minutes picked for a ${W}‑minute window. This is a family, not a schedule; something gives.`;
  }

  function resvPicker() {
    return `<div class="resv">
      <span class="resv-label">Café table</span>
      ${RESERVATIONS.map((t) => { const w = WAFFLES_AT - (toMin(t) + LUNCH_MIN); return `<button type="button" class="resv-chip ${reservation() === t ? 'on' : ''}" data-resv="${t}" aria-pressed="${reservation() === t}"><span>${fmt(toMin(t))}</span><small>${w} min to explore</small></button>`; }).join('')}
    </div>`;
  }

  function noteBlock(s) {
    const note = (S.notes[s.id] || {}).text || '';
    if (editingNote === s.id) {
      return `<div class="note-edit">
        <textarea data-note="${s.id}" placeholder="What happened here?" rows="3">${esc(note)}</textarea>
        <div class="btn-row"><button type="button" class="btn small" data-note-done="${s.id}">Done</button></div>
      </div>`;
    }
    if (note.trim()) {
      return `<blockquote class="fieldnote">${esc(note)}<button type="button" class="note-link" data-note-edit="${s.id}">edit</button></blockquote>`;
    }
    return `<button type="button" class="note-link" data-note-edit="${s.id}">+ field note</button>`;
  }

  function stopDetail(s) {
    return `
      <p class="stop-body">${esc(s.body)}</p>
      ${s.resv ? resvPicker() : ''}
      ${s.directions ? `<ol class="directions">${s.directions.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${routeStrip()}` : ''}
      ${s.map ? `<div class="map-wrap"><iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map to Homestead Heritage" src="https://www.google.com/maps?q=Homestead+Heritage,+608+Dry+Creek+Rd,+Waco,+TX+76705&z=9&output=embed"></iframe></div>` : ''}
      ${s.options ? `<div class="picks">${EXPLORE.map((o) => `<button type="button" class="pick ${picked(o.id) ? 'on' : ''}" data-opt="${o.id}" aria-pressed="${picked(o.id)}"><span>${esc(o.name)}</span><span class="pick-min">${o.min}m</span></button>`).join('')}</div>
        <p class="verdict">${esc(exploreVerdict())}</p>` : ''}
      ${s.map || s.link ? `<div class="btn-row">
        ${s.map ? `<a class="btn small primary" href="https://www.google.com/maps/dir/?api=1&destination=Homestead+Heritage,+608+Dry+Creek+Rd,+Waco,+TX+76705&waypoints=Summer+Moon+Coffee,+4217+Benner+Rd,+Kyle,+TX+78640&travelmode=driving" target="_blank" rel="noopener">Directions via Summer Moon</a>
                   <a class="btn small" href="https://maps.apple.com/?daddr=608+Dry+Creek+Rd,+Waco,+TX+76705&dirflg=d" target="_blank" rel="noopener">Apple Maps</a>` : ''}
        ${s.link ? `<a class="btn small" href="${s.link.href}" target="_blank" rel="noopener">${esc(s.link.label)}</a>` : ''}
      </div>` : ''}
      ${noteBlock(s)}`;
  }

  function renderDay() {
    STOPS = buildStops();
    const root = $('#view-day');
    const d = new Date();
    const dateStr = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const isSunday = d.getDay() === 0;
    const nowIdx = Math.max(0, STOPS.findIndex((s) => s.id === S.now));
    const now = STOPS[nowIdx];
    const next = STOPS.slice(nowIdx + 1).find((s) => !S.done.includes(s.id));
    const allDone = S.done.length >= STOPS.length;

    root.innerHTML = `
      <div class="day-head">
        <h2>The Day</h2>
        <p class="day-date">${esc(dateStr)}</p>
      </div>
      <p class="plan-bar">Pickup <strong>${esc(STOPS[0].time)}</strong> · table at <strong>${esc(fmt(toMin(reservation())))}</strong> · <strong>${exploreWindow()} min</strong> to explore · waffles <strong>${fmt(WAFFLES_AT)}</strong> · gone by <strong>3:00</strong></p>

      <section class="now-card">
        <div class="now-rubric"><span class="rubric">${allDone ? 'Complete' : 'Now'}</span><span class="now-count">stop ${nowIdx + 1} of ${STOPS.length}</span></div>
        <div class="now-time">${esc(now.time)}${now.sub ? `<span class="now-sub">${esc(now.sub)}</span>` : ''}</div>
        <h3 class="now-title">${esc(now.title)}</h3>
        ${stopDetail(now)}
        ${['coffee', 'drive'].includes(now.id) ? `<button type="button" class="nudge" data-goto="predict">Predictions are open. Lock them in before Elm Mott. ›</button>
          <button type="button" class="nudge" data-goto="road">Road questions for the car. ›</button>` : ''}
        ${now.id === 'home' || allDone ? `<button type="button" class="nudge" data-goto="predict">Vote the superlatives and settle the predictions. ›</button>` : ''}
        <div class="now-actions">
          ${allDone ? `<button type="button" class="btn block" data-report>Open the Trip Report</button>`
            : `<button type="button" class="btn primary block" data-advance>${next ? `Done · next, ${esc(next.title)}` : 'Done · that’s the day'}</button>`}
        </div>
      </section>

      <details class="essentials">
        <summary><span class="rubric">Hours, address & the Labor Day question</span></summary>
        <dl class="hours">
          <dt>Where</dt><dd>608 Dry Creek Rd, Waco, TX 76705 (Elm Mott)</dd>
          <dt>Village</dt><dd>Mon–Sat 10–5, closed Sunday</dd>
          <dt>Gristmill</dt><dd>Mon–Sat 9–5</dd>
          <dt>Waffles</dt><dd>Waco Waffle Co., Mon 7:30–2:30 (dessert, so be seated by 1:45)</dd>
          <dt>Café</dt><dd>Café Homestead, Mon 11–3</dd>
          <dt>Labor Day</dt><dd>Regular hours are expected, but the village has run a festival on Labor Day Monday before, so hours and crowds may differ. Confirm at <a href="tel:+12547549600">(254) 754‑9600</a>.</dd>
        </dl>
        ${S.settings.sabbath && isSunday ? '<p class="fine">It is Sunday. The village is closed. Sabbath mode has done its one job.</p>' : ''}
      </details>

      <span class="rubric tl-rubric">The whole day</span>
      <ol class="tl">
        ${STOPS.map((s, i) => {
          const done = S.done.includes(s.id);
          const isNow = i === nowIdx && !allDone;
          const state = isNow ? 'is-now' : done ? 'is-done' : 'is-later';
          const open = openStop === s.id && !isNow;
          const hasNote = ((S.notes[s.id] || {}).text || '').trim().length > 0;
          return `<li class="tl-row ${state} ${open ? 'is-open' : ''}" data-stop="${s.id}">
            <button type="button" class="tl-head" aria-expanded="${open}">
              <span class="tl-dot" aria-hidden="true">${done && !isNow ? '✓' : ''}</span>
              <span class="tl-time">${esc(s.time)}</span>
              <span class="tl-title">${esc(s.title)}</span>
              ${hasNote ? '<span class="tl-note" title="Has a field note">✎</span>' : ''}
              ${isNow ? '<span class="pill now">Now</span>' : `<span class="tl-chev">${open ? '▾' : '▸'}</span>`}
            </button>
            ${open ? `<div class="tl-body">
              ${stopDetail(s)}
              <div class="btn-row"><button type="button" class="btn small" data-jump="${s.id}">${done ? 'Reopen this stop' : 'Make this the current stop'}</button></div>
            </div>` : ''}
          </li>`;
        }).join('')}
      </ol>`;

    // Advance
    const adv = $('[data-advance]', root);
    if (adv) adv.addEventListener('click', () => {
      if (!S.done.includes(now.id)) S.done.push(now.id);
      if (!S.doneAt[now.id]) S.doneAt[now.id] = Date.now();
      const nx = STOPS.slice(nowIdx + 1).find((s) => !S.done.includes(s.id));
      if (nx) { S.now = nx.id; toast(`Onward to ${nx.title}`); }
      else toast('Day complete. Trip Report is ready.');
      editingNote = null; save(); renderDay(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const rep = $('[data-report]', root);
    if (rep) rep.addEventListener('click', showReport);
    $$('[data-goto]', root).forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

    // Timeline expand / jump
    $$('.tl-head', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.closest('.tl-row').dataset.stop;
      if (id === now.id && !allDone) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      openStop = openStop === id ? null : id;
      const y = window.scrollY; renderDay(); window.scrollTo({ top: y });
    }));
    $$('[data-jump]', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.jump;
      S.now = id; S.done = S.done.filter((d) => d !== id);
      openStop = null; save(); renderDay(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    // Notes
    $$('[data-note-edit]', root).forEach((b) => b.addEventListener('click', () => {
      editingNote = b.dataset.noteEdit;
      const y = window.scrollY; renderDay(); window.scrollTo({ top: y });
      const ta = $(`[data-note="${editingNote}"]`, root); if (ta) ta.focus();
    }));
    $$('[data-note-done]', root).forEach((b) => b.addEventListener('click', () => {
      editingNote = null; const y = window.scrollY; renderDay(); window.scrollTo({ top: y });
    }));
    $$('[data-note]', root).forEach((ta) => ta.addEventListener('input', () => {
      S.notes[ta.dataset.note] = { text: ta.value, ts: Date.now() }; save();
    }));

    // Reservation
    $$('[data-resv]', root).forEach((b) => b.addEventListener('click', () => {
      S.resv = { t: b.dataset.resv, ts: Date.now() }; save();
      toast(`Table at ${fmt(toMin(b.dataset.resv))}. Pickup moves to ${fmt(toMin(b.dataset.resv) - 180)}.`);
      const y = window.scrollY; renderDay(); window.scrollTo({ top: y });
    }));

    // Explore picks
    $$('[data-opt]', root).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.opt;
      S.picks[id] = { on: !picked(id), ts: Date.now() };
      save();
      const y = window.scrollY; renderDay(); window.scrollTo({ top: y });
    }));
  }

  /* ------------------------------------------------------------------
     Bingo
     ------------------------------------------------------------------ */

  // Deterministic card per player so a synced phone shows the same squares.
  function hashSeed(str) {
    let x = 2166136261;
    for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function rng(seed) {
    let s = seed || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  function cardFor(playerId) {
    const r = rng(hashSeed('homestead:' + playerId));
    const pool = BINGO_POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const cells = pool.slice(0, 24);
    cells.splice(12, 0, 'FREE');
    return cells;
  }
  const LINES = (() => {
    const L = [];
    for (let r = 0; r < 5; r++) L.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) L.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    L.push([0, 6, 12, 18, 24]);
    L.push([4, 8, 12, 16, 20]);
    return L;
  })();
  function completedLines(marks) {
    const set = new Set(marks); set.add(12);
    return LINES.filter((line) => line.every((i) => set.has(i)));
  }

  function renderBingo() {
    const root = $('#view-bingo');
    root.innerHTML = `<button type="button" class="back" data-back>‹ More</button><h2>Homestead Bingo</h2>`;
    $('[data-back]', root).addEventListener('click', () => show('more'));
    if (needPlayers(root)) return;
    const p = activePlayer();
    const marks = S.bingo[p.id] || [];
    const card = cardFor(p.id);
    const lines = completedLines(marks);
    const inLine = new Set(lines.flat());
    root.innerHTML += `
      <p class="view-intro">Each person gets their own card. Tap what you witness. Five in a row is a bingo and ten points.</p>
      ${playerChips()}
      <div class="bingo-grid" role="grid" aria-label="${esc(p.name)}’s bingo card">
        ${card.map((text, i) => {
          const free = i === 12;
          const marked = free || marks.includes(i);
          return `<button type="button" class="cell ${free ? 'is-free' : ''} ${marked ? 'is-marked' : ''} ${inLine.has(i) ? 'in-line' : ''}" data-cell="${i}" ${free ? 'disabled' : ''} aria-pressed="${marked}">${esc(text)}</button>`;
        }).join('')}
      </div>
      <p class="bingo-status ${lines.length ? 'win' : ''}">${lines.length ? `BINGO${lines.length > 1 ? ' ×' + lines.length : ''} for ${esc(p.name)}` : `${marks.length} of 24 witnessed`}</p>`;
    bindChips(root);
    $$('[data-cell]', root).forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.cell);
      const before = completedLines(S.bingo[p.id] || []).length;
      const cur = new Set(S.bingo[p.id] || []);
      if (cur.has(i)) {
        cur.delete(i);
        S.events = S.events.filter((e) => e.id !== `sq-${p.id}-${i}`); S.deleted.push(`sq-${p.id}-${i}`);
      } else {
        cur.add(i);
        S.deleted = S.deleted.filter((d) => d !== `sq-${p.id}-${i}`);
        addEvent({ id: `sq-${p.id}-${i}`, player: p.id, label: 'Bingo square: ' + card[i], points: 1 });
      }
      S.bingo[p.id] = Array.from(cur).sort((a, b) => a - b);
      const nowLines = completedLines(S.bingo[p.id]);
      // Award or revoke line bonuses deterministically so synced phones agree.
      const lineIds = new Set(nowLines.map((l) => `line-${p.id}-${l.join('.')}`));
      S.events = S.events.filter((e) => !(e.id.startsWith(`line-${p.id}-`) && !lineIds.has(e.id)));
      nowLines.forEach((l) => addEvent({ id: `line-${p.id}-${l.join('.')}`, player: p.id, label: 'BINGO', points: 10 }));
      if (nowLines.length > before) toast(`BINGO! ${p.name} +10`);
      save(); renderBingo();
    }));
  }

  /* ------------------------------------------------------------------
     Scoreboard
     ------------------------------------------------------------------ */

  function addEvent(ev) {
    if (S.events.some((e) => e.id === ev.id)) return;
    S.events.push(Object.assign({ ts: Date.now() }, ev));
  }
  function totals() {
    const t = {};
    S.players.forEach((p) => { t[p.id] = 0; });
    S.events.forEach((e) => { if (e.player in t) t[e.player] += e.points; });
    return S.players.map((p) => ({ p, pts: t[p.id] })).sort((a, b) => b.pts - a.pts);
  }

  function renderScore() {
    const root = $('#view-score');
    root.innerHTML = `<button type="button" class="back" data-back>‹ More</button><h2>Scoreboard</h2>`;
    $('[data-back]', root).addEventListener('click', () => show('more'));
    if (needPlayers(root)) return;
    const p = activePlayer();
    const board = totals();
    const recent = S.events.slice().sort((a, b) => b.ts - a.ts).slice(0, 12);
    root.innerHTML += `
      <p class="view-intro">Points are awarded by whoever is holding the phone, which is the only fair system.</p>
      ${(() => { const hh = householdTotals(board); return hh.length > 1 ? `<p class="households">${hh.map((h) => `<span><strong>${esc(h.name)}</strong> ${h.pts}</span>`).join('<span class="vs">vs.</span>')}</p>` : ''; })()}
      <ol class="leader">
        ${board.map((row, i) => `<li><span class="rank">${i + 1}</span><span class="who">${esc(row.p.name)}</span><span class="pts ${row.pts < 0 ? 'neg' : ''}">${row.pts}</span></li>`).join('')}
      </ol>
      <span class="rubric">Award to</span>
      ${playerChips()}
      <div class="presets">
        ${PRESETS.map((pr) => `<button type="button" class="preset" data-preset="${pr.id}"><span>${esc(pr.label)}</span><span class="pts ${pr.pts < 0 ? 'neg' : ''}">${pr.pts > 0 ? '+' : ''}${pr.pts}</span></button>`).join('')}
      </div>
      <form class="custom-row" data-custom>
        <input type="text" name="label" placeholder="Something else happened…" required />
        <input type="number" name="pts" value="1" step="1" required />
        <button class="btn small primary" type="submit">Add</button>
      </form>
      <hr class="rule" />
      <span class="rubric">Recent</span>
      <ul class="log">
        ${recent.length ? recent.map((e) => `<li><span class="t">${fmtTime(e.ts)}</span><span>${esc((player(e.player) || {}).name || '?')}: ${esc(e.label)}</span><span class="p">${e.points > 0 ? '+' : ''}${e.points}</span><button type="button" class="x" data-del="${esc(e.id)}" aria-label="Remove">×</button></li>`).join('') : '<li class="muted">Nothing yet. The day is young.</li>'}
      </ul>`;
    bindChips(root);
    $$('[data-preset]', root).forEach((b) => b.addEventListener('click', () => {
      const pr = PRESETS.find((x) => x.id === b.dataset.preset);
      addEvent({ id: uid(), player: p.id, label: pr.label, points: pr.pts, tag: pr.id });
      toast(`${p.name} ${pr.pts > 0 ? '+' : ''}${pr.pts}`);
      save(); renderScore();
    }));
    $('[data-custom]', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const label = f.label.value.trim(); const pts = Number(f.pts.value) || 0;
      if (!label) return;
      addEvent({ id: uid(), player: p.id, label, points: pts });
      toast(`${p.name} ${pts > 0 ? '+' : ''}${pts}`);
      save(); renderScore();
    });
    $$('[data-del]', root).forEach((b) => b.addEventListener('click', () => {
      const ev = S.events.find((e) => e.id === b.dataset.del);
      if (ev && ev.id.startsWith('sq-')) {
        const [, pid, idx] = ev.id.split('-');
        S.bingo[pid] = (S.bingo[pid] || []).filter((i) => i !== Number(idx));
      }
      S.events = S.events.filter((e) => e.id !== b.dataset.del); S.deleted.push(b.dataset.del);
      save(); renderScore();
    }));
  }

  /* ------------------------------------------------------------------
     Ratings
     ------------------------------------------------------------------ */

  function shopAverage(shopId) {
    const ns = S.players.map((p) => ((S.ratings[p.id] || {})[shopId] || {}).n).filter((n) => n);
    if (!ns.length) return null;
    return { avg: ns.reduce((a, b) => a + b, 0) / ns.length, count: ns.length };
  }

  let openGuide = null;
  function renderRate() {
    const root = $('#view-rate');
    root.innerHTML = `<h2>Rate</h2>`;
    if (needPlayers(root)) return;
    const p = activePlayer();
    root.innerHTML += `
      <p class="view-intro">The five‑loaf rating for every stop, with a field guide under each: what to notice and what to ask.</p>
      ${playerChips()}
      ${SHOPS.map((s) => {
        const mine = ((S.ratings[p.id] || {})[s.id] || {}).n || 0;
        const a = shopAverage(s.id);
        const open = openGuide === s.id;
        return `<div class="card shop" data-shop="${s.id}">
          <span class="name">${esc(s.name)}</span>
          <div class="loaves" role="radiogroup" aria-label="${esc(s.name)} rating">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="loaf ${n <= mine ? 'on' : ''}" data-n="${n}" aria-label="${n} loaves">🍞</button>`).join('')}
          </div>
          <p class="note">${esc(s.note)}</p>
          <button type="button" class="guide-toggle" data-guide="${s.id}" aria-expanded="${open}">${open ? '▾' : '▸'} Field guide</button>
          ${open ? `<div class="guide">
            <span class="guide-h">What to notice</span><p>${esc(s.notice)}</p>
            <span class="guide-h">Ask them</span><ul>${s.ask.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
          </div>` : ''}
          <p class="avg">${a ? `Family average ${a.avg.toFixed(1)} of 5 from ${a.count} vote${a.count === 1 ? '' : 's'}` : 'Not yet rated'}</p>
        </div>`;
      }).join('')}`;
    bindChips(root);
    $$('[data-guide]', root).forEach((b) => b.addEventListener('click', () => {
      openGuide = openGuide === b.dataset.guide ? null : b.dataset.guide;
      const y = window.scrollY; renderRate(); window.scrollTo({ top: y });
    }));
    $$('.loaf', root).forEach((b) => b.addEventListener('click', () => {
      const shop = b.closest('[data-shop]').dataset.shop;
      const n = Number(b.dataset.n);
      S.ratings[p.id] = S.ratings[p.id] || {};
      const cur = (S.ratings[p.id][shop] || {}).n;
      S.ratings[p.id][shop] = { n: cur === n ? 0 : n, ts: Date.now() };
      save(); renderRate();
    }));
  }

  /* ------------------------------------------------------------------
     Predict: predictions on the way up, superlatives on the way home
     ------------------------------------------------------------------ */

  function lateBucket(min) {
    if (min <= 0) return 'On time';
    if (min <= 15) return '1–15 min';
    if (min <= 30) return '16–30 min';
    if (min <= 60) return '31–60 min';
    return 'Don’t ask';
  }
  // Drift: when Explore was marked done (= arriving at waffles) vs. the planned waffle time.
  function measuredDrift() {
    const ts = S.doneAt.explore;
    if (!ts) return null;
    const d = new Date(ts);
    return d.getHours() * 60 + d.getMinutes() - WAFFLES_AT;
  }
  function topRatedShop() {
    const r = SHOPS.map((sh) => ({ sh, a: shopAverage(sh.id) })).filter((x) => x.a).sort((a, b) => b.a.avg - a.a.avg);
    return r.length ? r[0].sh.id : null;
  }
  function actualFor(q) {
    const manual = (S.actuals[q.id] || {}).v;
    if (q.id === 'top') return manual || topRatedShop();
    if (q.id === 'late') { const m = measuredDrift(); return manual || (m === null ? null : lateBucket(m)); }
    return manual === undefined ? null : manual;
  }
  function labelFor(q, v) {
    if (v === null || v === undefined || v === '') return '—';
    if (q.type === 'shop') return (SHOPS.find((x) => x.id === v) || {}).name || v;
    if (q.type === 'player') return (player(v) || {}).name || v;
    if (q.type === 'yesno') return v === 'yes' ? 'Yes' : 'No';
    return String(v);
  }
  function optionsFor(q) {
    if (q.type === 'shop') return SHOPS.map((x) => ({ v: x.id, l: x.name }));
    if (q.type === 'player') return S.players.map((x) => ({ v: x.id, l: x.name }));
    if (q.type === 'yesno') return [{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }];
    return q.options.map((o) => ({ v: o, l: o }));
  }
  function supWinners(cat) {
    const tally = {};
    Object.values(S.votes[cat.id] || {}).forEach((v) => { if (v && v.p && player(v.p)) tally[v.p] = (tally[v.p] || 0) + 1; });
    const max = Math.max(0, ...Object.values(tally));
    return max ? Object.keys(tally).filter((k) => tally[k] === max) : [];
  }
  // Recompute derived points deterministically so every synced phone agrees.
  function settleScores() {
    S.events = S.events.filter((e) => !e.id.startsWith('pred-') && !e.id.startsWith('sup-'));
    S.players.forEach((pl) => PREDICTIONS.forEach((q) => {
      const mine = ((S.preds[pl.id] || {})[q.id] || {}).v;
      const act = actualFor(q);
      if (mine && act && mine === act) S.events.push({ id: `pred-${pl.id}-${q.id}`, player: pl.id, label: `Called it: ${q.q}`, points: PRED_POINTS, ts: Date.now() });
    }));
    SUPERLATIVES.forEach((cat) => supWinners(cat).forEach((w) => {
      S.events.push({ id: `sup-${cat.id}-${w}`, player: w, label: cat.name, points: SUP_POINTS, ts: Date.now() });
    }));
  }

  let predictSection = 'before';
  function renderPredict() {
    const root = $('#view-predict');
    root.innerHTML = `<h2>Predict</h2>`;
    if (needPlayers(root)) return;
    const p = activePlayer();
    settleScores(); save();
    const tabs = `<div class="seg">
      <button type="button" class="${predictSection === 'before' ? 'on' : ''}" data-seg="before">On the way up</button>
      <button type="button" class="${predictSection === 'after' ? 'on' : ''}" data-seg="after">On the way home</button>
    </div>`;

    if (predictSection === 'before') {
      const settled = PREDICTIONS.filter((q) => actualFor(q)).length;
      root.innerHTML += `
        <p class="view-intro">Lock in your calls before Elm Mott. ${PRED_POINTS} points per correct prediction, settled on the way home.</p>
        ${tabs}
        ${playerChips()}
        ${PREDICTIONS.map((q) => {
          const mine = ((S.preds[p.id] || {})[q.id] || {}).v;
          const act = actualFor(q);
          const others = S.players.filter((x) => x.id !== p.id).map((x) => { const v = ((S.preds[x.id] || {})[q.id] || {}).v; return v ? `${x.name}: ${labelFor(q, v)}` : null; }).filter(Boolean);
          return `<div class="card pred" data-q="${q.id}">
            <div class="pred-q">${esc(q.q)}${act ? `<span class="pill ${mine === act ? 'now' : ''}">${mine === act ? 'Called it' : 'Actual: ' + esc(labelFor(q, act))}</span>` : ''}</div>
            <div class="optgrid">${optionsFor(q).map((o) => `<button type="button" class="optbtn ${mine === o.v ? 'on' : ''}" data-pick="${esc(o.v)}">${esc(o.l)}</button>`).join('')}</div>
            ${others.length ? `<p class="others">${others.map(esc).join(' · ')}</p>` : ''}
          </div>`;
        }).join('')}
        <p class="fine">${settled ? `${settled} of ${PREDICTIONS.length} settled so far.` : 'Nothing is settled yet. Switch to “On the way home” once the day is done.'}</p>`;
      bindChips(root);
      $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => {
        const q = b.closest('[data-q]').dataset.q;
        S.preds[p.id] = S.preds[p.id] || {};
        const cur = (S.preds[p.id][q] || {}).v;
        S.preds[p.id][q] = { v: cur === b.dataset.pick ? null : b.dataset.pick, ts: Date.now() };
        save(); const y = window.scrollY; renderPredict(); window.scrollTo({ top: y });
      }));
    } else {
      const drift = measuredDrift();
      const manualQs = PREDICTIONS.filter((q) => !['top'].includes(q.id));
      root.innerHTML += `
        <p class="view-intro">Two jobs for the car home: settle what actually happened, then vote the superlatives. ${SUP_POINTS} points to each winner.</p>
        ${tabs}
        <span class="rubric">Settle the day</span>
        <p class="fine">Highest‑rated stop comes from the Field Guide ratings${drift !== null ? `; lateness was measured at ${drift <= 0 ? 'on time' : drift + ' minutes behind'} when Explore ended` : ''}. The rest, the group decides.</p>
        ${manualQs.map((q) => {
          const act = (S.actuals[q.id] || {}).v || (q.id === 'late' ? actualFor(q) : null);
          return `<div class="card pred" data-aq="${q.id}">
            <div class="pred-q">${esc(q.q)}</div>
            <div class="optgrid">${optionsFor(q).map((o) => `<button type="button" class="optbtn ${act === o.v ? 'on' : ''}" data-actual="${esc(o.v)}">${esc(o.l)}</button>`).join('')}</div>
          </div>`;
        }).join('')}
        <hr class="rule" />
        <span class="rubric">Superlatives</span>
        ${playerChips()}
        <p class="fine">${esc(p.name)} is voting. You cannot vote for yourself; this is a family, not Congress.</p>
        ${SUPERLATIVES.map((cat) => {
          const mine = ((S.votes[cat.id] || {})[p.id] || {}).p;
          const winners = supWinners(cat);
          const nVotes = Object.values(S.votes[cat.id] || {}).filter((v) => v && v.p).length;
          return `<div class="card pred" data-cat="${cat.id}">
            <div class="pred-q">${esc(cat.name)}${winners.length ? `<span class="pill now">${winners.map((w) => esc((player(w) || {}).name || '')).join(' & ')}</span>` : ''}</div>
            <div class="optgrid">${S.players.filter((x) => x.id !== p.id).map((x) => `<button type="button" class="optbtn ${mine === x.id ? 'on' : ''}" data-vote="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>
            <p class="others">${nVotes} of ${S.players.length} votes in</p>
          </div>`;
        }).join('')}
        <div class="btn-row"><button type="button" class="btn primary" data-report>Open the Trip Report</button></div>`;
      bindChips(root);
      $$('[data-actual]', root).forEach((b) => b.addEventListener('click', () => {
        const q = b.closest('[data-aq]').dataset.aq;
        const cur = (S.actuals[q] || {}).v;
        S.actuals[q] = { v: cur === b.dataset.actual ? null : b.dataset.actual, ts: Date.now() };
        save(); const y = window.scrollY; renderPredict(); window.scrollTo({ top: y });
      }));
      $$('[data-vote]', root).forEach((b) => b.addEventListener('click', () => {
        const cat = b.closest('[data-cat]').dataset.cat;
        S.votes[cat] = S.votes[cat] || {};
        const cur = (S.votes[cat][p.id] || {}).p;
        S.votes[cat][p.id] = { p: cur === b.dataset.vote ? null : b.dataset.vote, ts: Date.now() };
        save(); const y = window.scrollY; renderPredict(); window.scrollTo({ top: y });
      }));
      $('[data-report]', root).addEventListener('click', showReport);
    }
    $$('[data-seg]', root).forEach((b) => b.addEventListener('click', () => { predictSection = b.dataset.seg; renderPredict(); window.scrollTo({ top: 0 }); }));
  }

  /* ------------------------------------------------------------------
     Road: questions for the car
     ------------------------------------------------------------------ */

  function renderRoad() {
    const root = $('#view-road');
    const n = ROAD_QUESTIONS.length;
    const i = ((S.roadIdx || 0) % n + n) % n;
    root.innerHTML = `
      <h2>Road Questions</h2>
      <p class="view-intro">For the car. Some are light, some are not. Whoever is holding the phone reads it out; whoever is driving answers last.</p>
      <section class="road-card">
        <span class="road-count">${i + 1} of ${n}</span>
        <p class="road-q">${esc(ROAD_QUESTIONS[i])}</p>
      </section>
      <div class="road-nav">
        <button type="button" class="btn" data-road="-1" ${i === 0 ? 'disabled' : ''}>‹ Back</button>
        <button type="button" class="btn quiet small" data-road="shuffle">Shuffle</button>
        <button type="button" class="btn primary" data-road="1" ${i === n - 1 ? 'disabled' : ''}>Next ›</button>
      </div>
      <p class="fine">${i === n - 1 ? 'That is the deck. If you are still driving, start again or sit with the last one.' : 'No answers are recorded. This one is just for the car.'}</p>`;
    $$('[data-road]', root).forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.road === 'shuffle') { let j = i; while (j === i) j = Math.floor(Math.random() * n); S.roadIdx = j; }
      else S.roadIdx = Math.min(n - 1, Math.max(0, i + Number(b.dataset.road)));
      save(); renderRoad();
    }));
  }

  /* ------------------------------------------------------------------
     More: menu, report, primer, sync, settings, about
     ------------------------------------------------------------------ */

  function renderMore() {
    const root = $('#view-more');
    root.innerHTML = `
      <h2>More</h2>
      <ul class="menu">
        <li><button type="button" data-go="score">Scoreboard <small>Points from predictions and superlatives, plus whatever you award</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="bingo">Homestead Bingo <small>For the watchful. Optional.</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="report">Trip Report <small>Charts nobody asked for</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="primer">Who Are These People? <small>A short, fair primer on Homestead Heritage</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="sync">Sync by Link <small>Fallback when the family room is off</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="settings">Settings <small>Players, and toggles that do nothing</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="notes">Release Notes <small>v${VERSION}</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="privacy">Privacy Policy <small>Short</small><span class="arrow">›</span></button></li>
      </ul>
      <p class="fine">HomesteadOS v${VERSION} (Waco). Built the night before, as is tradition. Runs entirely on this phone; there is no server, which is also how the gristmill works.</p>`;
    $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => pages[b.dataset.go]()));
  }

  const pages = { bingo: () => show('bingo'), score: () => show('score'), report: showReport, primer: showPrimer, sync: showSync, settings: showSettings, notes: showNotes, privacy: showPrivacy };

  /* Trip report -------------------------------------------------------- */

  function barChart(rows) {
    // Single-series horizontal bars: one hue, direct labels, no legend needed.
    const W = 520, rowH = 30, padL = 110, padR = 46, padT = 8;
    const H = padT + rows.length * rowH + 8;
    const max = Math.max(1, ...rows.map((r) => Math.abs(r.pts)));
    const scale = (W - padL - padR) / max;
    const x0 = padL;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points by family member">
      <line class="axis" x1="${x0}" x2="${x0}" y1="${padT}" y2="${H - 8}" />
      ${rows.map((r, i) => {
        const y = padT + i * rowH + 6;
        const w = Math.abs(r.pts) * scale;
        const x = r.pts >= 0 ? x0 : x0 - w;
        return `<text x="${x0 - 10}" y="${y + 13}" text-anchor="end">${esc(r.p.name)}</text>
          <rect class="bar" x="${x}" y="${y}" width="${Math.max(2, w)}" height="18" rx="3" />
          <text class="val" x="${r.pts >= 0 ? x0 + w + 8 : x - 8}" y="${y + 13}" text-anchor="${r.pts >= 0 ? 'start' : 'end'}">${r.pts}</text>`;
      }).join('')}
    </svg>`;
  }

  function pieChartOfPie(slices) {
    // Yes, a pie chart. Of pie. It is the one pie chart the rules allow.
    const total = slices.reduce((a, s) => a + s.n, 0);
    const cx = 110, cy = 110, r = 90;
    if (!total) return `<p class="muted">No pie recorded. This is a tragedy, and also a data quality issue.</p>`;
    let angle = -Math.PI / 2;
    const shades = ['var(--gold)', 'var(--umber)', 'var(--vermilion)', 'var(--verdigris)', 'var(--plum)', 'var(--lapis)', 'var(--slate)'];
    const paths = slices.map((s, i) => {
      const a0 = angle, a1 = angle + (s.n / total) * Math.PI * 2; angle = a1;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const mid = (a0 + a1) / 2, lx = cx + (r * 0.62) * Math.cos(mid), ly = cy + (r * 0.62) * Math.sin(mid);
      const d = total === s.n ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0` :
        `M ${cx} ${cy} L ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`;
      return `<path class="slice" d="${d}" fill="${shades[i % shades.length]}" />
        <text x="${lx}" y="${ly + 4}" text-anchor="middle" style="fill:#fff8ec;font-weight:600">${s.n}</text>`;
    }).join('');
    const legend = slices.map((s, i) => `<g transform="translate(230, ${24 + i * 22})"><rect width="12" height="12" rx="2" fill="${shades[i % shades.length]}"/><text x="18" y="11">${esc(s.name)}</text></g>`).join('');
    return `<svg class="chart" viewBox="0 0 400 220" role="img" aria-label="Pie eaten, by family member">${paths}${legend}
      <text class="cap" x="230" y="${24 + slices.length * 22 + 14}">slices of pie, self‑reported</text></svg>`;
  }

  function showReport() {
    settleScores(); save();
    const board = totals();
    const drift = measuredDrift();
    const predRows = S.players.map((pl) => ({ pl, n: PREDICTIONS.filter((q) => { const v = ((S.preds[pl.id] || {})[q.id] || {}).v; const a = actualFor(q); return v && a && v === a; }).length, total: PREDICTIONS.filter((q) => ((S.preds[pl.id] || {})[q.id] || {}).v).length })).filter((r) => r.total).sort((a, b) => b.n - a.n);
    const supRows = SUPERLATIVES.map((cat) => ({ cat, w: supWinners(cat) })).filter((r) => r.w.length);
    const squares = Object.values(S.bingo).reduce((a, m) => a + m.length, 0);
    const bingos = S.players.reduce((a, p) => a + completedLines(S.bingo[p.id] || []).length, 0);
    const rated = SHOPS.map((s) => ({ s, a: shopAverage(s.id) })).filter((x) => x.a).sort((a, b) => b.a.avg - a.a.avg);
    const pie = S.players.map((p) => ({ name: p.name, n: S.events.filter((e) => e.player === p.id && e.tag === 'pie').length })).filter((x) => x.n);
    const notes = STOPS.map((s) => ({ s, t: (S.notes[s.id] || {}).text })).filter((x) => x.t && x.t.trim());
    const champion = board[0];
    const html = `
      <h2>Trip Report</h2>
      <p class="muted"><em>${esc(new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))} · Homestead Heritage, Elm Mott, Texas</em></p>
      <div class="stat-row">
        <div class="stat"><div class="n">${squares}</div><div class="l">bingo squares witnessed</div></div>
        <div class="stat"><div class="n">${bingos}</div><div class="l">bingos</div></div>
        <div class="stat"><div class="n">${S.done.length}/${STOPS.length}</div><div class="l">stops completed</div></div>
      </div>
      ${champion ? `<blockquote>${esc(champion.p.name)} finishes the day on ${champion.pts} points${board.length > 1 ? `, ahead of ${esc(board[1].p.name)} by ${champion.pts - board[1].pts}` : ''}. History will judge whether it was earned.</blockquote>` : ''}
      ${drift !== null ? `<p class="muted"><em>${drift <= 0 ? 'The day ran on time, which nobody predicted.' : `The day ran ${drift} minutes behind by the time Explore ended.`}</em></p>` : ''}
      <span class="rubric">Points by person</span>
      ${board.length ? barChart(board) : '<p class="muted">No players yet.</p>'}
      <span class="rubric">Pie chart of pie</span>
      ${pieChartOfPie(pie)}
      <span class="rubric">Predictions</span>
      ${predRows.length ? `<ol>${predRows.map((r) => `<li>${esc(r.pl.name)} <span class="muted">${r.n} of ${r.total} right</span></li>`).join('')}</ol>` : '<p class="muted">No predictions were made. Bold.</p>'}
      <span class="rubric">Superlatives</span>
      ${supRows.length ? `<ul>${supRows.map((r) => `<li><strong>${esc(r.cat.name)}:</strong> ${r.w.map((w) => esc((player(w) || {}).name || '')).join(' & ')}</li>`).join('')}</ul>` : '<p class="muted">Not yet voted.</p>'}
      <span class="rubric">Family rankings</span>
      ${rated.length ? `<ol>${rated.map((x) => `<li>${esc(x.s.name)} <span class="muted">${x.a.avg.toFixed(1)} of 5</span></li>`).join('')}</ol>` : '<p class="muted">Nothing rated yet.</p>'}
      <span class="rubric">Field notes</span>
      ${notes.length ? notes.map((x) => `<p><strong>${esc(x.s.title)}.</strong> ${esc(x.t)}</p>`).join('') : '<p class="muted">The record is silent.</p>'}
      <div class="btn-row"><button type="button" class="btn" data-copy>Copy as text</button><button type="button" class="btn quiet" data-close>Close</button></div>`;
    openModal(html, (m) => {
      $('[data-close]', m).addEventListener('click', closeModal);
      $('[data-copy]', m).addEventListener('click', async () => {
        const text = [
          `HomesteadOS Trip Report`,
          `${squares} bingo squares, ${bingos} bingos, ${S.done.length}/${STOPS.length} stops`,
          ...board.map((r, i) => `${i + 1}. ${r.p.name}: ${r.pts}`),
          rated.length ? 'Rankings: ' + rated.map((x) => `${x.s.name} ${x.a.avg.toFixed(1)}`).join(', ') : '',
          ...supRows.map((r) => `${r.cat.name}: ${r.w.map((w) => (player(w) || {}).name).join(' & ')}`),
          ...notes.map((x) => `${x.s.title}: ${x.t}`),
        ].filter(Boolean).join('\n');
        try { await navigator.clipboard.writeText(text); toast('Copied'); } catch (e) { toast('Could not copy'); }
      });
    });
  }

  /* Primer --------------------------------------------------------------- */

  function showPrimer() {
    openModal(`
      <h2>Who Are These People?</h2>
      <p class="muted"><em>A short primer, written to be fair to them.</em></p>
      <p>Homestead Heritage is a Christian intentional community. It began in 1973 when Blair and Regina Adams started a small fellowship in Manhattan, and after some moves it settled on land near Elm Mott, north of Waco, which the community calls Brazos de Dios. Blair Adams led it until his death in 2021.</p>
      <p>They place themselves in the Anabaptist lineage: the sixteenth‑century movement that gave us the Mennonites, Amish, and Hutterites. What that means for them is a believers’ church, nonviolence, simplicity of life, and a conviction that Christianity is meant to be lived as a community rather than attended as a service. The farming and the crafts are not a costume; they are the community’s way of practising self‑sufficiency and teaching it to others.</p>
      <p><strong>Are they Amish?</strong> No, and they would say so. They are not part of any Amish or Mennonite conference, and they use electricity, vehicles, and the internet. The crafts village is about craftsmanship and stewardship, not a rule against technology. “Is this Amish?” is nonetheless a Bingo square, because someone will ask.</p>
      <p><strong>The village you are visiting</strong> is an eighteen‑acre public face of the community: a rebuilt eighteenth‑century gristmill, a pottery, a woodworking shop, a forge, fiber arts, a café, and a store. Roughly two hundred thousand people visit each year, most of them at the Homestead Fair over Thanksgiving weekend.</p>
      <p><strong>A fair word.</strong> Like most close‑knit communities, Homestead Heritage has drawn both warm profiles and critical reporting over the years. If you want to form a view, read both sides and ask the people you meet; they are generally glad to talk about what they believe.</p>
      <p class="fine">Sources: homesteadheritage.com (Our History; About Blair Adams), homesteadcraftvillage.com, Mother Earth News (2013), Texas Observer (2012).</p>
      <div class="btn-row"><button type="button" class="btn quiet" data-close>Close</button></div>`,
      (m) => $('[data-close]', m).addEventListener('click', closeModal));
  }

  /* Sync ---------------------------------------------------------------- */

  const b64url = {
    enc: (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    dec: (str) => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  };
  function snapshot() {
    return { players: S.players, bingo: S.bingo, events: S.events, deleted: S.deleted, ratings: S.ratings, notes: S.notes, done: S.done, picks: S.picks, resv: S.resv, preds: S.preds, actuals: S.actuals, votes: S.votes, doneAt: S.doneAt, now: S.now };
  }
  async function encodeState() {
    const json = JSON.stringify(snapshot());
    const bytes = new TextEncoder().encode(json);
    if (typeof CompressionStream === 'function') {
      const cs = new CompressionStream('deflate-raw');
      const w = cs.writable.getWriter(); w.write(bytes); w.close();
      const out = new Uint8Array(await new Response(cs.readable).arrayBuffer());
      return 'd.' + b64url.enc(out);
    }
    return 'j.' + b64url.enc(bytes);
  }
  async function decodeState(str) {
    const [kind, data] = str.split('.', 2);
    let bytes = b64url.dec(data);
    if (kind === 'd') {
      const ds = new DecompressionStream('deflate-raw');
      const w = ds.writable.getWriter(); w.write(bytes); w.close();
      bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function merge(remote) {
    let n = 0;
    (remote.players || []).forEach((rp) => { if (!player(rp.id)) { S.players.push(rp); n++; } });
    Object.entries(remote.bingo || {}).forEach(([pid, cells]) => {
      const cur = new Set(S.bingo[pid] || []); const before = cur.size;
      cells.forEach((c) => cur.add(c));
      S.bingo[pid] = Array.from(cur).sort((a, b) => a - b); n += cur.size - before;
    });
    (remote.deleted || []).forEach((id) => { if (!S.deleted.includes(id)) { S.deleted.push(id); n++; } });
    (remote.events || []).forEach((e) => { if (!S.deleted.includes(e.id) && !S.events.some((x) => x.id === e.id)) { S.events.push(e); n++; } });
    const beforeLen = S.events.length; S.events = S.events.filter((e) => !S.deleted.includes(e.id) || e.id.startsWith('pred-') || e.id.startsWith('sup-')); n += beforeLen - S.events.length;
    Object.entries(remote.ratings || {}).forEach(([pid, shops]) => {
      S.ratings[pid] = S.ratings[pid] || {};
      Object.entries(shops).forEach(([sid, r]) => {
        const cur = S.ratings[pid][sid];
        if (!cur || (r.ts || 0) > (cur.ts || 0)) { S.ratings[pid][sid] = r; n++; }
      });
    });
    Object.entries(remote.notes || {}).forEach(([sid, note]) => {
      const cur = S.notes[sid];
      if (!cur || (note.ts || 0) > (cur.ts || 0)) { S.notes[sid] = note; n++; }
    });
    (remote.done || []).forEach((d) => { if (!S.done.includes(d)) { S.done.push(d); n++; } });
    (remote.plan || []).forEach((d) => { if (!S.picks[d]) { S.picks[d] = { on: true, ts: 0 }; n++; } });
    Object.entries(remote.picks || {}).forEach(([k, v]) => { const cur = S.picks[k]; if (!cur || (v.ts || 0) > (cur.ts || 0)) { S.picks[k] = v; n++; } });
    if (remote.resv && (!S.resv || (remote.resv.ts || 0) > (S.resv.ts || 0))) { S.resv = remote.resv; n++; }
    const lww2 = (mine, theirs) => { Object.entries(theirs || {}).forEach(([k1, inner]) => { mine[k1] = mine[k1] || {}; Object.entries(inner || {}).forEach(([k2, v]) => { const cur = mine[k1][k2]; if (!cur || (v.ts || 0) > (cur.ts || 0)) { mine[k1][k2] = v; n++; } }); }); };
    lww2(S.preds, remote.preds); lww2(S.votes, remote.votes);
    Object.entries(remote.actuals || {}).forEach(([k, v]) => { const cur = S.actuals[k]; if (!cur || (v.ts || 0) > (cur.ts || 0)) { S.actuals[k] = v; n++; } });
    Object.entries(remote.doneAt || {}).forEach(([k, ts]) => { if (!S.doneAt[k] || ts < S.doneAt[k]) { S.doneAt[k] = ts; n++; } });
    if (remote.now) {
      const ri = STOPS.findIndex((s) => s.id === remote.now), li = STOPS.findIndex((s) => s.id === S.now);
      if (ri > li) S.now = remote.now;
    }
    if (!S.active && S.players.length) S.active = S.players[0].id;
    S.setup = S.setup || S.players.length > 0;
    return n;
  }

  /* Family room: live sync through the mailbox server (server/ on Railway). */
  const ROOM_DEFAULT_URL = '';                 // baked in once the Railway URL exists
  const ROOM_DEFAULT_CODE = 'austins-martins';
  const room = { url: ROOM_DEFAULT_URL, code: ROOM_DEFAULT_CODE, client: null, dirty: true, since: 0, lastOk: 0, status: 'off', pushTimer: null, timer: null, inflight: false };
  try {
    const cfg = JSON.parse(localStorage.getItem('homesteados.room') || '{}');
    if (typeof cfg.url === 'string') room.url = cfg.url;
    if (typeof cfg.code === 'string' && cfg.code) room.code = cfg.code;
    room.client = localStorage.getItem('homesteados.client');
    if (!room.client) { room.client = uid() + uid(); localStorage.setItem('homesteados.client', room.client); }
  } catch (e) { room.client = room.client || uid(); }
  const roomOn = () => /^https?:\/\//.test(room.url) && /^[A-Za-z0-9_-]{1,64}$/.test(room.code);
  const roomBase = () => room.url.replace(/\/+$/, '') + '/room/' + encodeURIComponent(room.code);

  function saveRoomCfg() { try { localStorage.setItem('homesteados.room', JSON.stringify({ url: room.url, code: room.code })); } catch (e) {} }
  function roomDirty() {
    room.dirty = true;
    if (!roomOn()) return;
    clearTimeout(room.pushTimer);
    room.pushTimer = setTimeout(roomTick, 800);      // push soon after a change
  }
  function setRoomStatus(st) {
    room.status = st;
    const el = $('#syncDot'); if (!el) return;
    el.dataset.status = st;
    el.title = st === 'ok' ? 'Family room: connected' : st === 'error' ? 'Family room: cannot reach server' : 'Family room: off';
    el.hidden = st === 'off';
  }
  async function roomTick() {
    if (!roomOn() || room.inflight) return;
    if (document.visibilityState === 'hidden') return;
    room.inflight = true;
    try {
      if (room.dirty) {
        const r = await fetch(`${roomBase()}/${room.client}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot()) });
        if (!r.ok) throw new Error('push ' + r.status);
        room.dirty = false;
      }
      const r2 = await fetch(`${roomBase()}?since=${room.since}`, { cache: 'no-store' });
      if (!r2.ok) throw new Error('pull ' + r2.status);
      const data = await r2.json();
      let n = 0;
      Object.entries(data.clients || {}).forEach(([cid, entry]) => {
        if (cid === room.client || !entry || !entry.state) return;
        n += merge(entry.state);
      });
      room.since = data.now || Date.now();
      room.lastOk = Date.now();
      setRoomStatus('ok');
      if (n) {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
        room.dirty = true;                          // share the merged whole back out
        if (!$('#modal').open) { const y = window.scrollY; rerender(); window.scrollTo({ top: y }); }
      }
    } catch (e) {
      setRoomStatus('error');
    } finally {
      room.inflight = false;
    }
  }
  function startRoom() {
    clearInterval(room.timer);
    if (!roomOn()) { setRoomStatus('off'); return; }
    room.since = 0; room.dirty = true;
    setRoomStatus('error');
    roomTick();
    room.timer = setInterval(roomTick, 4000);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { room.since = 0; roomTick(); } });
  window.addEventListener('online', () => roomTick());

  async function showSync() {
    const code = await encodeState();
    const url = location.origin + location.pathname + '#sync=' + code;
    openModal(`
      <h2>Sync Phones</h2>
      <p>There is no server. Phones sync the way families do: by texting each other. Send this link to another phone, open it there, and both scoreboards merge. Do it both directions and everyone has everything.</p>
      <div class="share-box">${esc(url)}</div>
      <p class="fine">${url.length.toLocaleString()} characters. Nothing leaves the link.</p>
      <div class="btn-row">
        <button type="button" class="btn primary" data-share>${navigator.share ? 'Share link' : 'Copy link'}</button>
        <button type="button" class="btn quiet" data-close>Close</button>
      </div>`,
      (m) => {
        $('[data-close]', m).addEventListener('click', closeModal);
        $('[data-share]', m).addEventListener('click', async () => {
          try {
            if (navigator.share) await navigator.share({ title: 'HomesteadOS sync', url });
            else { await navigator.clipboard.writeText(url); toast('Link copied'); }
          } catch (e) { /* user cancelled */ }
        });
      });
  }

  async function handleIncomingSync() {
    const m = location.hash.match(/#sync=([^&]+)/);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    try {
      const remote = await decodeState(m[1]);
      const n = merge(remote);
      save();
      toast(n ? `Synced: merged ${n} thing${n === 1 ? '' : 's'}` : 'Synced: already up to date');
    } catch (e) {
      toast('That sync link did not work');
    }
  }

  /* Settings ------------------------------------------------------------ */

  function showSettings() {
    const html = `
      <h2>Settings</h2>
      <span class="rubric">Who is on this trip</span>
      <ul class="players-edit" style="list-style:none;padding:0;margin:0.4rem 0 0.8rem">
        ${S.players.map((p) => `<li><input type="text" value="${esc(p.name)}" data-rename="${esc(p.id)}" /><button type="button" class="btn small quiet" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">×</button></li>`).join('')}
      </ul>
      <form data-add class="custom-row" style="grid-template-columns:1fr auto"><input type="text" name="name" placeholder="Add a person" /><button class="btn small" type="submit">Add</button></form>
      <hr class="rule" />
      <span class="rubric">Family room</span>
      <p class="fine">Live sync between phones through a tiny server. Everyone with the same room code sees the same ratings, predictions, and votes within a few seconds. Leave the server blank to stay offline and use texted links instead.</p>
      <label class="fine" for="roomUrl">Server</label>
      <input type="url" id="roomUrl" value="${esc(room.url)}" placeholder="https://your-service.up.railway.app" autocapitalize="off" autocorrect="off" />
      <label class="fine" for="roomCode" style="margin-top:0.4rem;display:block">Room code</label>
      <input type="text" id="roomCode" value="${esc(room.code)}" autocapitalize="off" autocorrect="off" />
      <div class="btn-row"><button type="button" class="btn small primary" data-room-save>Connect</button><span class="fine" data-room-status>${room.status === 'ok' ? 'Connected.' : room.status === 'error' ? 'Cannot reach the server.' : 'Off.'}</span></div>
      <hr class="rule" />
      <div class="setting"><div><span class="lbl">Sabbath mode</span><small>Reminds you the village is closed on Sundays. It is closed on Sundays regardless.</small></div><button type="button" class="toggle ${S.settings.sabbath ? 'on' : ''}" data-toggle="sabbath" aria-pressed="${S.settings.sabbath}"></button></div>
      <div class="setting"><div><span class="lbl">Haptic feedback</span><small>Where supported. Otherwise provided by gravel.</small></div><button type="button" class="toggle ${S.settings.haptics ? 'on' : ''}" data-toggle="haptics" aria-pressed="${S.settings.haptics}"></button></div>
      <div class="setting"><div><span class="lbl">Push notifications</span><small>Handled in person by whoever is most hungry.</small></div><button type="button" class="toggle ${S.settings.push ? 'on' : ''}" data-toggle="push" aria-pressed="${S.settings.push}"></button></div>
      <div class="setting"><div><span class="lbl">Candlelight mode</span><small>The moon button up top. It works, which is more than the others can say.</small></div></div>
      <hr class="rule" />
      <div class="btn-row">
        <button type="button" class="btn quiet" data-reset>Reset the whole day</button>
        <button type="button" class="btn primary" data-close>Done</button>
      </div>`;
    openModal(html, (m) => {
      $('[data-close]', m).addEventListener('click', () => { closeModal(); rerender(); });
      $$('[data-rename]', m).forEach((i) => i.addEventListener('change', () => {
        const p = player(i.dataset.rename); if (p && i.value.trim()) { p.name = i.value.trim(); save(); }
      }));
      $$('[data-remove]', m).forEach((b) => b.addEventListener('click', () => {
        S.players = S.players.filter((p) => p.id !== b.dataset.remove);
        if (S.active === b.dataset.remove) S.active = (S.players[0] || {}).id || null;
        save(); showSettings();
      }));
      $('[data-add]', m).addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim(); if (!name) return;
        addPlayer(name); save(); showSettings();
      });
      $$('[data-toggle]', m).forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.toggle; S.settings[k] = !S.settings[k]; save();
        b.classList.toggle('on', S.settings[k]); b.setAttribute('aria-pressed', S.settings[k]);
        if (k === 'push' && S.settings.push) toast('Notification: someone is hungry.');
      }));
      $('[data-room-save]', m).addEventListener('click', async () => {
        room.url = $('#roomUrl', m).value.trim(); room.code = $('#roomCode', m).value.trim() || ROOM_DEFAULT_CODE;
        saveRoomCfg(); startRoom();
        const st = $('[data-room-status]', m); st.textContent = roomOn() ? 'Connecting…' : 'Off.';
        setTimeout(() => { st.textContent = room.status === 'ok' ? 'Connected.' : room.status === 'error' ? 'Cannot reach the server. Check the URL.' : 'Off.'; }, 1500);
      });
      $('[data-reset]', m).addEventListener('click', () => {
        if (confirm('Reset everything on this phone? Scores, bingo, ratings, notes. There is no undo, as in life.')) {
          S = emptyState(); save(); closeModal(); show('day'); setupPlayers();
        }
      });
    });
  }

  function addPlayer(name) {
    let id = slug(name); let k = 2;
    while (player(id)) id = slug(name) + '-' + k++;
    S.players.push({ id, name });
    if (!S.active) S.active = id;
  }

  function setupPlayers() {
    openModal(`
      <h2>Who is on this trip?</h2>
      <p class="muted">One name per line. Everyone gets a bingo card and a place on the scoreboard.</p>
      <textarea data-names rows="5" placeholder="Noah&#10;…">${S.players.length ? esc(S.players.map((p) => p.name).join('\n')) : 'Noah\nJill\nBlake\nMegan'}</textarea>
      <div class="btn-row"><button type="button" class="btn primary" data-ok>Let’s go</button></div>`,
      (m) => {
        const ta = $('[data-names]', m);
        setTimeout(() => ta.focus(), 50);
        $('[data-ok]', m).addEventListener('click', () => {
          const names = ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
          if (!names.length) return;
          const existing = S.players.slice();
          S.players = []; S.active = null;
          names.forEach((n) => {
            const prev = existing.find((p) => p.name.toLowerCase() === n.toLowerCase());
            if (prev) { S.players.push(prev); if (!S.active) S.active = prev.id; } else addPlayer(n);
          });
          S.setup = true; save(); closeModal(); rerender();
          toast(`${S.players.length} on the trip`);
        });
      });
  }

  /* Release notes & privacy ---------------------------------------------- */

  function showNotes() {
    openModal(`
      <h2>Release Notes</h2>
      <div class="release"><h3>1.4.0 · Family Room</h3><ul>
        <li>Live sync between phones through a small server on Railway. Ratings, predictions, and votes appear everywhere within seconds.</li>
        <li>Deleting a score now sticks across phones. Explore picks no longer resurrect themselves.</li>
      </ul></div>
      <div class="release"><h3>1.3.1</h3><ul>
        <li>Road Questions shipped, after the developer was asked where they were.</li>
        <li>Guide renamed back to Rate. Scoreboard joins Bingo under More.</li>
      </ul></div>
      <div class="release"><h3>1.3.0 · Four Adults</h3><ul>
        <li>Predictions on the way up, superlatives on the way home. Points settle themselves.</li>
        <li>Ratings grew into a Field Guide: what to notice at each stop and what to ask.</li>
        <li>Bingo demoted to the More menu after a frank conversation about who was going to play it.</li>
      </ul></div>
      <div class="release"><h3>1.2.0 · Reservation</h3><ul>
        <li>Schedule reversed: café first, waffles for dessert, gone by three.</li>
        <li>Pick the café reservation and every other time recalculates. The Explore window is shown per slot so the trade‑off is visible.</li>
      </ul></div>
      <div class="release"><h3>1.1.0 · Elm Mott</h3><ul>
        <li>Added the Martins. Added Summer Moon. Added Austins vs. Martins.</li>
        <li>Added directions and a map, per the spec “whatever looks best.”</li>
        <li>The Explore stop now adds up minutes and passes judgment.</li>
        <li>Waffles corrected to Waco Waffle Co., which turns out to be on the Homestead grounds.</li>
        <li>The Day tab rebuilt: one “Now” card, a compact timeline, and field notes tucked away until wanted.</li>
      </ul></div>
      <div class="release"><h3>1.0.0 · Waco</h3><ul>
        <li>Initial release. Contains everything.</li>
        <li>Bingo, Scoreboard, Ratings, Field Notes, Trip Report, Sync.</li>
        <li>Known issue: does not work on Sundays. Neither does the village.</li>
        <li>Known issue: cannot make anyone stop teasing the developer.</li>
      </ul></div>
      <div class="release"><h3>0.9.0</h3><ul>
        <li>Removed the “Should We Buy This?” calculator after focus‑group feedback (the family).</li>
      </ul></div>
      <div class="release"><h3>0.1.0</h3><ul>
        <li>Developer was teased for making web apps for everything.</li>
        <li>Development began.</li>
      </ul></div>
      <div class="btn-row"><button type="button" class="btn quiet" data-close>Close</button></div>`,
      (m) => $('[data-close]', m).addEventListener('click', closeModal));
  }

  function showPrivacy() {
    openModal(`
      <h2>Privacy Policy</h2>
      <p>This app stores everything on your phone and nowhere else. There is no server. There are no analytics. There is no account. When you use “Sync Phones,” your data travels inside a link you choose to send, to a person you choose to send it to, and that is the whole architecture.</p>
      <p>We do not collect your location. We have a rough idea, since you are at a gristmill.</p>
      <h3>Terms of Service</h3>
      <ol><li>Be kind to your family.</li><li>Ask the artisans real questions.</li><li>The cheese rating is final.</li></ol>
      <div class="btn-row"><button type="button" class="btn quiet" data-close>Close</button></div>`,
      (m) => $('[data-close]', m).addEventListener('click', closeModal));
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  function boot() {
    const log = $('#bootlog'), bar = $('#bootbar'), screen = $('#boot');
    const seen = sessionStorage.getItem('homesteados.booted');
    const delay = seen ? 40 : 260;
    let i = 0;
    const step = () => {
      if (i < BOOT_LINES.length) {
        log.textContent += (i ? '\n' : '') + BOOT_LINES[i];
        bar.style.width = Math.round(((i + 1) / BOOT_LINES.length) * 100) + '%';
        i++; setTimeout(step, delay);
      } else {
        try { sessionStorage.setItem('homesteados.booted', '1'); } catch (e) {}
        screen.classList.add('is-done');
        setTimeout(() => screen.remove(), 500);
        if (!S.setup) setupPlayers();
      }
    };
    step();
  }

  show('day');
  handleIncomingSync().then(rerender);
  $('#syncDot').addEventListener('click', showSettings);
  startRoom();
  boot();
})();
