# Little Chef

A heavily graphical kitchen game for kids (built for a 7- and a 9-year-old) that trains
**sustained attention** and **prospective memory**: holding a pending task in mind, staying
productively busy, and coming back to it at the right moment.

No reading is needed to play. Everything is pictures, animation and sound.

It is a plain web app: no build step, no dependencies, no accounts, nothing leaves the device.

## Run it

```bash
npm start
```

Then open <http://localhost:5173> (best on a tablet in landscape, or any desktop browser).

Any static file server works too – the game is just `index.html` plus ES modules. To put it
on a tablet, host the folder anywhere static (for example GitHub Pages: *Settings → Pages →
Deploy from branch → main / root*) and use "Add to Home Screen". Once opened online it also
works offline.

```bash
npm test
```

runs the engine tests (Node's built-in test runner, no install needed).

## How it plays

1. A customer walks up and waves. Tap them: their order appears as a food picture.
2. Tap the matching station to start cooking.
3. Each dish has one or more **timed steps** (flip the pancake, drain the pasta, pop the
   toast). These are the attention targets.
4. While it cooks there is real kitchen work to do: greet the next customer, wash plates at
   the sink, restock from the fridge, wipe spills (and, later, pour juice and clear tables).
   Cooking needs clean plates and ingredients, so the busywork matters.
5. Come back to the station in time and tap it. Tapping a station that is still cooking is a
   **peek**: it shows how far along the dish is, but does nothing else.
6. The dish is served, the customer reacts, and stars and coins fly in.

| Outcome | Stars | Customer |
| --- | --- | --- |
| Every timed step inside the perfect window | 3 | happy |
| A step done in the grace period | 2 | okay |
| A step missed – the dish burns but is still served | 1 | "bleh!" (funny, not punishing) |
| Burnt dish left alone, or order never started | 0 | leaves sad |

Coins buy new recipes (soup, grilled cheese, fries, cookies – two of them bring a new
station), chef outfits, pets, wall colours and decorations.

## The attention design

**Three independent dials**, raised one at a time on a 10-level ladder:

| Dial | Steps |
| --- | --- |
| Cue strength | **Loud** (timer ring, bouncing station, repeating sound) → **Clear** (no ring) → **Subtle** (a sparkle and one quiet sound) → **Silent** (nothing: track the time yourself, or peek) |
| Wait length | 8–11 s → 12–16 s → 17–23 s → 24–31 s → 32–40 s, with the perfect window shrinking from 6 s to 4 s |
| Concurrency | one dish → two dishes with staggered timers → two dishes plus interruptions (juice requests, more spills) |

**Mastery** is a success rate over the last orders at the current level (8 of the last 10;
5 of 6 on the very first level) before the next step unlocks. Three failures in a row, or
mostly failing over six orders, steps back down so nobody gets stuck frustrated.

**Busy vs. absent.** The game separates "doing other kitchen work" from "no interaction at
all". Ten seconds with no touch while a dish is cooking is recorded as a *spacing-out event*.
Being busy never counts. The game makes sure there is always something legitimate to do while
a dish waits, and after a spacing-out it brings the next job forward. On early levels (or
after a dish is lost to spacing out) the chef gives a gentle idle nudge – looking around and
waving – which never points at the stove.

**Each station has its own sound** – bubbling stove, sizzling griddle, ticking toaster,
fizzing fryer, humming oven – and its own "ready" motif, so the audio cues are learnable.

**Sessions.** A daily goal of 5–10 minutes (default 7) fills a progress ring; the sky in the
kitchen window moves from morning to night as the session goes. At closing time no new
customers arrive and the session ends once the last one is served. A daily cap and an
optional cool-down between sessions prevent over-play (the kitchen "goes to sleep").

All timers run on a game clock that pauses when the app is backgrounded or paused.

## Screen layouts

All three layouts from the spec are in, landscape with big tap targets:

1. **Classic Counter** – stations along the bottom, customers behind the counter. Used for
   the one-dish levels.
2. **Split Kitchen** – cooking on the left, dining room and busywork on the right. Switches
   on automatically when two-dish mode unlocks. Tables have to be cleared here too.
3. **Chef's Eye** – first-person over the stations with customers at a serving hatch. A
   bonus view parents can pick.

Parents can force any layout per child.

## Parent Mode

The gear button on the home screen (behind a small sum) opens the one place with words:

- **Dashboard per child**: sessions played, success rate, average reaction time to the
  cooking step, spacing-out events (per session and per 10 minutes of cooking), and trend
  charts over the last 20 sessions.
- **Per-child profiles**, so siblings progress independently (up to six).
- **Manual override of the three dials**, or nudge the automatic level up or down.
- Daily goal, daily cap, cool-down, sound and music; per-child layout and idle-nudge choice;
  rename, reset or delete a profile; export all data as JSON.

## Project layout

```
index.html            app shell
styles/               main.css (base + shared animation), kitchen.css, screens.css
src/main.js           stage scaling, screen routing
src/engine/           pure game logic – no DOM, fully unit-tested
  kitchen.js          the kitchen simulation (customers, stations, busywork, attention)
  recipes.js          recipes and the wait/window timing tables
  difficulty.js       the three dials, the level ladder and mastery rules
  stats.js            session summaries, dashboard numbers, daily goal / cap
  storage.js          local profiles and settings
  catalog.js          the shop
  clock.js            game clock that pauses in the background
src/ui/
  kitchenView.js      the playable kitchen (input → engine → animation and sound)
  layouts.js          the three screen layouts as plain coordinates
  audio.js            all sound, synthesised with WebAudio
  fx.js               flying stars, coins, confetti
  art/                every picture in the game, drawn as SVG in code
  screens/            home, hub, shop, summary, parent mode
tests/                engine tests
gallery.html          every piece of art on one page (handy when drawing)
```

## Debug helpers

Add query parameters to the URL:

| Parameter | Effect |
| --- | --- |
| `quick=1` | skip the menus and start cooking with the first profile |
| `level=0..9` | start at a given level (with `quick`) |
| `layout=1..3` | force a layout (with `quick`) |
| `speed=4` | run the game clock faster |
| `session=60` | session length in seconds |
| `bot=1` / `bot=lazy` / `bot=idle` | auto-player: plays well / never does timed steps / never touches anything |
| `seed=7` | repeatable customers and timings |
| `tutorial=1` | replay the pointing-hand tutorial (with `quick`) |

## Open questions from the spec – what was chosen

- **Wait windows and grace periods**: see the table above (`src/engine/recipes.js`); each
  recipe scales the base wait a little (toast is quicker, pasta slower).
- **Idle nudge**: yes on the loud and clear cue levels, off above that unless a dish was just
  lost to spacing out; parents can set always / never.
- **Session caps and cool-down**: daily cap (default 20 min) and optional cool-down, both in
  Parent Mode.
- **Sibling co-op**: not built. Profiles are independent.
