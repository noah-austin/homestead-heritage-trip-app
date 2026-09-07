# HomesteadOS

An entirely unnecessary web app for one family's day at
[Homestead Heritage](https://www.homesteadheritage.com/) in Elm Mott, Texas.

My family teased me for making web apps for everything. This is the response.

**Live:** https://noah-austin.github.io/homestead-heritage-trip-app/

## What it does

- **The Day.** The schedule (pickup, Summer Moon in Kyle, the drive, lunch at Café Homestead, explore, waffles at Waco Waffle Co. for dessert, gone by three), derived from whichever café reservation you pick, directions with a map, an Explore planner that adds up minutes, and a field-notes box for every stop.
- **Rate.** The five-loaf rating with family averages, and a field guide under each stop: what to
  notice and two questions to ask the artisan.
- **Predict.** Predictions locked in on the drive up, settled on the drive home, plus superlatives
  voted in the car. Correct calls and wins feed the scoreboard automatically.
- **Road.** Twenty questions for the car, some light, some not.
- **Scoreboard.** Under More. Points awarded by whoever is holding the phone, plus the ones that settle themselves.
- **Bingo.** Under More, for the watchful. Everyone gets their own 5×5 card.
- **Trip Report.** Stats, a bar chart, and a pie chart of pie.
- **Sync Phones.** No server; phones merge by texting each other a link.
- **Settings.** Players, plus toggles that do nothing, plus one that does (candlelight mode).

## How it is built

Plain HTML, CSS, and JavaScript. No build step, no framework, no backend. State lives in
`localStorage`. The parchment-and-ink look borrows the design tokens from
[Commonplace](https://noah-austin.github.io/Theology-Site/).

Open `index.html` in a browser, or serve the folder with anything:

```bash
python3 -m http.server 8000
```

## Deploying

Pushes to `main` publish to GitHub Pages through `.github/workflows/pages.yml`.
One-time setup: the repository must be **public** (Pages on a free plan requires it), and
**Settings → Pages → Source** must be set to **GitHub Actions**. Then re-run the workflow.
