/* HomesteadOS — one family's day, over-engineered on purpose.
   No server. No analytics. No framework. Everything lives in localStorage,
   and phones sync by texting each other a link. */

(function () {
  'use strict';

  const VERSION = '1.1.0';
  const STORE_KEY = 'homesteados.v1';

  /* ------------------------------------------------------------------
     Content
     ------------------------------------------------------------------ */

  const STOPS = [
    { id: 'pickup', time: '9:00', title: 'Austins collect the Martins',
      body: 'Noah and Jill pick up Blake and Megan. Bathroom before, not after. Water bottles. Charged phones; this app has needs.' },
    { id: 'coffee', time: '9:20', title: 'Summer Moon, Kyle',
      body: '4217 Benner Rd #400, Kyle. Wood‑fired coffee and Moon Milk, which is sweet cream with a cult following. Order for the car; the drive is long.',
      link: { label: 'Open Summer Moon in Maps', href: 'https://www.google.com/maps/search/?api=1&query=Summer+Moon+Coffee+4217+Benner+Rd+Kyle+TX+78640' } },
    { id: 'drive', time: '9:45 · about 2¼ hours', title: 'The Drive',
      body: 'I‑35 north the whole way: through Austin, past Temple, past Waco. Assign a DJ. Argue about the DJ.',
      directions: [
        'Take I‑35 north to exit 343 (Elm Mott, FM 308).',
        'Go west on FM 308 for 3.1 miles to the flashing light at FM 933.',
        'Turn right (north) on FM 933 for 1.6 miles.',
        'Turn left on Halbert Lane and follow it through the Brazos de Dios entrance.',
      ],
      map: true },
    { id: 'waffles', time: '~12:00', title: 'Waffles at Waco Waffle Co.',
      body: '224 Halbert Ln, on the Homestead grounds, in a restored 1700s timber‑frame house with its own water wheel. Open 7:30 to 2:30. Sweet: the University (peanut butter, banana, chocolate, caramel) or the Webster (strawberries, Nutella, cream). Savory: the Silo, a jalapeño‑cheddar waffle with fried chicken, egg, turkey bacon, and avocado. Nobody has to order the Silo. Someone should.',
      link: { label: 'Waco Waffle menu', href: 'https://www.wacowaffle.com/' } },
    { id: 'explore', time: '12:45 to 2:30', title: 'Explore',
      body: 'This is the open part of the day. Pick what sounds good; the app adds up the minutes and tells you whether you are being realistic.',
      options: true },
    { id: 'lunch', time: '2:30', title: 'Late lunch at Café Homestead',
      body: 'Café Homestead’s kitchen closes at 3 on Mondays, so be seated by 2:30. The Tea House in the Gristmill is the lighter alternative if the café is slammed. Order pie “to share.” Watch what happens.' },
    { id: 'home', time: '3:30', title: 'Homeward',
      body: 'The village closes at 5 but you will be gone. Reverse the directions, argue about the DJ again. The Trip Report generates itself under More. Someone will nap in the car (−1).' },
  ];

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
  const EXPLORE_WINDOW = 105; // minutes between waffles and late lunch

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
    { id: 'gristmill', name: 'Homestead Gristmill', note: 'c. 1760 timber‑frame mill; cider mill and tea room inside.' },
    { id: 'pottery', name: 'The Potter’s House', note: 'Wheel‑thrown stoneware. It looks easy. It is not.' },
    { id: 'wood', name: 'Woodworking Shop', note: 'Hand‑cut joinery, furniture, the smell of sawdust.' },
    { id: 'forge', name: 'The Forge', note: 'Blacksmithing. Stand back. Then lean in.' },
    { id: 'fiber', name: 'Fiber Crafts', note: 'Spinning, weaving, quilting.' },
    { id: 'basket', name: 'Basketry', note: 'Woven by hand, held together by patience.' },
    { id: 'cheese', name: 'Cheese', note: 'Judge harshly. This is the one that matters.' },
    { id: 'waffle', name: 'Waco Waffle Co.', note: 'Waffles in a timber‑frame house. Rate the waffle, not the house.' },
    { id: 'cafe', name: 'Café Homestead', note: 'Lunch. Pie. The rating that ends friendships.' },
    { id: 'giftbarn', name: 'Gift Barn', note: 'Where resolve goes to be tested.' },
    { id: 'grounds', name: 'Grounds & Animals', note: 'The barn, the fields, whatever stared at you.' },
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
    plan: [],                 // chosen explore option ids
    now: 'pickup',            // current stop
    settings: { sabbath: true, haptics: true, push: false },
    setup: false,
  });

  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(emptyState(), JSON.parse(raw));
    } catch (e) { /* fall through */ }
    return emptyState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* private mode, etc. */ }
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

  const renderers = { day: renderDay, bingo: renderBingo, score: renderScore, rate: renderRate, more: renderMore };
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

  function renderDay() {
    const root = $('#view-day');
    const d = new Date();
    const dateStr = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const isSunday = d.getDay() === 0;
    const planMin = EXPLORE.filter((o) => S.plan.includes(o.id)).reduce((a, o) => a + o.min, 0);
    const verdict = !S.plan.length ? 'Nothing picked yet. The gristmill is the safe first choice.'
      : planMin <= EXPLORE_WINDOW - 20 ? `${planMin} minutes picked for a ${EXPLORE_WINDOW}‑minute window. Comfortable. Add something.`
      : planMin <= EXPLORE_WINDOW ? `${planMin} minutes picked for a ${EXPLORE_WINDOW}‑minute window. Tight but honest.`
      : `${planMin} minutes picked for a ${EXPLORE_WINDOW}‑minute window. This is a family, not a schedule; something gives.`;
    root.innerHTML = `
      <h2>The Day</h2>
      <p class="view-intro">${esc(dateStr)}. Tap a stop to make it the current one; tap it again to mark it done.${S.settings.sabbath && isSunday ? ' It is Sunday, so the village is closed. Sabbath mode has done its one job.' : ''}</p>
      <div class="card">
        <span class="rubric">Homestead Heritage</span>
        <dl class="hours">
          <dt>Where</dt><dd>608 Dry Creek Rd, Waco, TX 76705 (Elm Mott)</dd>
          <dt>Village</dt><dd>Mon–Sat 10–5, closed Sunday</dd>
          <dt>Gristmill</dt><dd>Mon–Sat 9–5</dd>
          <dt>Waffles</dt><dd>Waco Waffle Co., Mon 7:30–2:30</dd>
          <dt>Café</dt><dd>Café Homestead, Mon 11–3</dd>
          <dt>Labor Day</dt><dd>Regular hours are expected, but the village has run a festival on Labor Day Monday before, so hours and crowds may differ. Confirm at <a href="tel:+12547549600">(254) 754‑9600</a>.</dd>
        </dl>
      </div>
      ${routeStrip()}
      <ol class="stops">
        ${STOPS.map((s) => {
          const done = S.done.includes(s.id);
          const isNow = s.id === S.now;
          const note = (S.notes[s.id] || {}).text || '';
          return `<li class="stop ${done ? 'is-done' : ''} ${isNow ? 'is-now' : ''}" data-stop="${s.id}">
            <div class="stop-head">
              <h3 class="stop-title">${esc(s.title)}</h3>
              <span class="stop-time">${esc(s.time)}</span>
              ${isNow ? '<span class="pill now">Now</span>' : done ? '<span class="pill">Done</span>' : ''}
            </div>
            <p class="stop-body">${esc(s.body)}</p>
            ${s.directions ? `<ol class="directions">${s.directions.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
            ${s.map ? `<div class="map-wrap"><iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map to Homestead Heritage" src="https://www.google.com/maps?q=Homestead+Heritage,+608+Dry+Creek+Rd,+Waco,+TX+76705&z=9&output=embed"></iframe></div>
              <div class="btn-row">
                <a class="btn small primary" href="https://www.google.com/maps/dir/?api=1&destination=Homestead+Heritage,+608+Dry+Creek+Rd,+Waco,+TX+76705&waypoints=Summer+Moon+Coffee,+4217+Benner+Rd,+Kyle,+TX+78640&travelmode=driving" target="_blank" rel="noopener">Directions via Summer Moon</a>
                <a class="btn small" href="https://maps.apple.com/?daddr=608+Dry+Creek+Rd,+Waco,+TX+76705&dirflg=d" target="_blank" rel="noopener">Apple Maps</a>
              </div>` : ''}
            ${s.options ? `<ul class="options">${EXPLORE.map((o) => `<li><label class="opt ${S.plan.includes(o.id) ? 'on' : ''}"><input type="checkbox" data-opt="${o.id}" ${S.plan.includes(o.id) ? 'checked' : ''} /><span class="opt-name">${esc(o.name)}</span><span class="opt-min">${o.min} min</span><span class="opt-note">${esc(o.note)}</span></label></li>`).join('')}</ul>
              <p class="verdict">${esc(verdict)}</p>` : ''}
            ${s.link ? `<a class="btn small" href="${s.link.href}" target="_blank" rel="noopener">${esc(s.link.label)}</a>` : ''}
            <div class="stop-note">
              <label for="note-${s.id}">Field notes</label>
              <textarea id="note-${s.id}" data-note="${s.id}" placeholder="What happened here?">${esc(note)}</textarea>
            </div>
          </li>`;
        }).join('')}
      </ol>`;

    $$('.stop-head', root).forEach((head) => head.addEventListener('click', () => {
      const id = head.closest('.stop').dataset.stop;
      if (S.now === id) {
        if (!S.done.includes(id)) S.done.push(id);
        const idx = STOPS.findIndex((s) => s.id === id);
        const next = STOPS.slice(idx + 1).find((s) => !S.done.includes(s.id));
        S.now = next ? next.id : id;
        toast(next ? `Onward to ${next.title}` : 'Day complete. Trip Report is ready under More.');
      } else {
        S.now = id;
        S.done = S.done.filter((d) => d !== id);
      }
      save(); renderDay();
    }));
    $$('[data-note]', root).forEach((ta) => ta.addEventListener('input', () => {
      S.notes[ta.dataset.note] = { text: ta.value, ts: Date.now() };
      save();
    }));
    $$('[data-opt]', root).forEach((cb) => cb.addEventListener('change', () => {
      const id = cb.dataset.opt;
      S.plan = cb.checked ? S.plan.concat(id) : S.plan.filter((x) => x !== id);
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
    root.innerHTML = `<h2>Homestead Bingo</h2>`;
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
        S.events = S.events.filter((e) => e.id !== `sq-${p.id}-${i}`);
      } else {
        cur.add(i);
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
    root.innerHTML = `<h2>Scoreboard</h2>`;
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
      S.events = S.events.filter((e) => e.id !== b.dataset.del);
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

  function renderRate() {
    const root = $('#view-rate');
    root.innerHTML = `<h2>Ratings</h2>`;
    if (needPlayers(root)) return;
    const p = activePlayer();
    root.innerHTML += `
      <p class="view-intro">Rate each stop on the five‑loaf scale. Family averages appear as votes come in.</p>
      ${playerChips()}
      ${SHOPS.map((s) => {
        const mine = ((S.ratings[p.id] || {})[s.id] || {}).n || 0;
        const a = shopAverage(s.id);
        return `<div class="card shop" data-shop="${s.id}">
          <span class="name">${esc(s.name)}</span>
          <div class="loaves" role="radiogroup" aria-label="${esc(s.name)} rating">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="loaf ${n <= mine ? 'on' : ''}" data-n="${n}" aria-label="${n} loaves">🍞</button>`).join('')}
          </div>
          <p class="note">${esc(s.note)}</p>
          <p class="avg">${a ? `Family average ${a.avg.toFixed(1)} of 5 from ${a.count} vote${a.count === 1 ? '' : 's'}` : 'No votes yet'}</p>
        </div>`;
      }).join('')}`;
    bindChips(root);
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
     More: menu, report, primer, sync, settings, about
     ------------------------------------------------------------------ */

  function renderMore() {
    const root = $('#view-more');
    root.innerHTML = `
      <h2>More</h2>
      <ul class="menu">
        <li><button type="button" data-go="report">Trip Report <small>Charts nobody asked for</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="primer">Who Are These People? <small>A short, fair primer on Homestead Heritage</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="sync">Sync Phones <small>Text a link, merge the scores</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="settings">Settings <small>Players, and toggles that do nothing</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="notes">Release Notes <small>v${VERSION}</small><span class="arrow">›</span></button></li>
        <li><button type="button" data-go="privacy">Privacy Policy <small>Short</small><span class="arrow">›</span></button></li>
      </ul>
      <p class="fine">HomesteadOS v${VERSION} (Waco). Built the night before, as is tradition. Runs entirely on this phone; there is no server, which is also how the gristmill works.</p>`;
    $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => pages[b.dataset.go]()));
  }

  const pages = { report: showReport, primer: showPrimer, sync: showSync, settings: showSettings, notes: showNotes, privacy: showPrivacy };

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
    const board = totals();
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
      <span class="rubric">Points by person</span>
      ${board.length ? barChart(board) : '<p class="muted">No players yet.</p>'}
      <span class="rubric">Pie chart of pie</span>
      ${pieChartOfPie(pie)}
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
  async function encodeState() {
    const json = JSON.stringify({ players: S.players, bingo: S.bingo, events: S.events, ratings: S.ratings, notes: S.notes, done: S.done, plan: S.plan, now: S.now });
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
    (remote.events || []).forEach((e) => { if (!S.events.some((x) => x.id === e.id)) { S.events.push(e); n++; } });
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
    (remote.plan || []).forEach((d) => { if (!S.plan.includes(d)) { S.plan.push(d); n++; } });
    if (remote.now) {
      const ri = STOPS.findIndex((s) => s.id === remote.now), li = STOPS.findIndex((s) => s.id === S.now);
      if (ri > li) S.now = remote.now;
    }
    if (!S.active && S.players.length) S.active = S.players[0].id;
    S.setup = S.setup || S.players.length > 0;
    return n;
  }

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
      <div class="release"><h3>1.1.0 · Elm Mott</h3><ul>
        <li>Added the Martins. Added Summer Moon. Added Austins vs. Martins.</li>
        <li>Added directions and a map, per the spec “whatever looks best.”</li>
        <li>The Explore stop now adds up minutes and passes judgment.</li>
        <li>Waffles corrected to Waco Waffle Co., which turns out to be on the Homestead grounds.</li>
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
  boot();
})();
