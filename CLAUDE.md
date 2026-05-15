# The Warden

Papers-Please-style game where the player is a UK parking warden. Inspect parked cars, decide PASS or issue a PCN (Penalty Charge Notice). Each in-game day adds a new rule that stacks on top of prior days.

## Stack

- Vite + TypeScript (vanilla, no framework)
- DOM-only rendering — programmer art via styled `div`s. No canvas.
- Vitest for rule tests.

## Commands

```
npm run dev      # dev server (Vite)
npm run build    # tsc + vite build → dist/
npx vitest run   # run rule tests
```

## Architecture

Single source of truth: `src/game/state.ts` — pub/sub store. UI subscribes, re-renders on every patch.

All authored content lives under `src/data/` as JSON. Game code in `src/game/` and `src/ui/` is logic only — it loads the JSON at module init.

```
src/
├── main.ts                  entry; binds events, drives day loop
├── style.css
├── game/
│   ├── types.ts             Car, Doc, Rule, GameState, TuningRaw, DocReactiveNote, …
│   ├── state.ts             store: getState/setState/subscribe; SAVE_VERSION
│   ├── streets.ts           STREETS loaded from data/streets.json + streetsForDay(day)
│   ├── rules.ts             RULES registry; activeRules(day) gates by firstDay  (TS — predicates are code)
│   ├── validate.ts          validate(car, rules, clock) → Violation[]
│   ├── cars.ts              buildCars(specs, day, history) → Car[]; toneFromHistory; pickReactiveVariant
│   ├── days/index.ts        DAYS[]: discovers data/days/day*.json via import.meta.glob; loadDay parses
│   ├── residents.ts         RESIDENTS loaded from data/residents.json + by-id/plate lookups
│   ├── tuning.ts            TUNING loaded from data/tuning.json (shiftStart, wages.{correct,wrong,flawlessBonus})
│   ├── supervisor.ts        reviewShift(log, config, rand) → sample + penalty
│   └── stats.ts             career stats persistence
├── data/                    AUTHORED CONTENT — JSON only
│   ├── days/
│   │   └── day1.json … day6.json   per-day briefing, streets, rent, supervisor, cars[]
│   ├── residents.json       Resident[] (id, name, plate, bio, homeStreetId?)
│   ├── streets.json         Street[] (id, name, kind, zone)
│   ├── tuning.json          { shiftStart, wages }
│   └── sprites/
│       ├── cars.json        Record<model, asciiGrid>
│       ├── icons.json       Record<iconName, asciiGrid>
│       ├── doc.json         { crest, stamp } ASCII grids
│       └── palette.json     { base: Record<char, hex>, carColours: Record<name, hex> }
├── ui/
│   ├── hud.ts               top bar: day, clock, car #, wages, mistakes
│   ├── scene.ts             street + car composition
│   ├── docs.ts              dashboard documents wrapper
│   ├── rulebook.ts          regulations panel (cumulative across days)
│   ├── actions.ts           PASS + PCN code buttons (filtered by active rules)
│   ├── briefing.ts          day-start briefing modal + end-of-day summary
│   └── sprites/             pixel art engine
│       ├── pixelArt.ts      ASCII grid + palette → SVG rasterizer
│       ├── palette.ts       loads palette.json; exports BASE_PALETTE, COLOUR_HEX, carPalette()
│       ├── car.ts           loads cars.json; renderCarSprite(car)
│       ├── doc.ts           loads doc.json; renderDocPaper(doc) HTML templates
│       ├── icons.ts         loads icons.json; lamppost(), ticketMachine(), zoneSign(zone), …
│       └── kerb.ts          composes pavement + kerb + road + car
├── editor/                  dev-only authoring UI (see Editor section)
└── tests/
    ├── validate.test.ts
    ├── days-loader.test.ts
    ├── narrative.test.ts
    ├── residents.test.ts
    └── supervisor.test.ts
```

## Adding a new day / rule

Adding a Day-N mechanic separates **data** (JSON, also editable via `/editor.html`) from **logic** (rules.ts, doc rendering).

1. **Rule** (logic — only if the new day introduces a new violation) — append to `RULES` in `src/game/rules.ts` with `id`, `code`, `label`, `firstDay: N`, and a `check` returning `true` when the car is in violation. PCN code + label live on the rule itself; `actions.ts` and the rulebook derive their lists from `RULES` automatically.
2. **Day file** — create `src/data/days/dayN.json` (or use the editor's `+ New day` button — it writes a skeleton). Fields: `day`, `briefing`, `newRuleSummary[]`, `streets[]` (street ids), `rent`, optional `supervisor`, and `cars[]`. `DAYS` is discovered by `import.meta.glob` so no code change is needed to register a new day file. Each car has `seenAt: "HH:MM"`, `plate`, `colour`, `model`, `street`, `docs[]`, optional `residentId`.
3. **Doc type** (if new) — extend `Doc` and `DocRaw` unions in `types.ts`, add a `parseDoc` case in `src/game/days/index.ts`, render in `src/ui/sprites/doc.ts` (`renderDocPaper`). For doc-type-aware rules, `validate.ts` reads `car.docs` directly; no `DOC_BUILDERS` lookup any more.
4. **Street kind** (if new) — add to `StreetKind` union in `types.ts`, style `.kerb.<kind>` in `style.css`, and update the kerb composition in `src/ui/sprites/kerb.ts` if it should show a unique sign. Add the actual street record in `src/data/streets.json` (or via the editor).
5. **Test** — add a row to the per-day expected-truth table in `tests/days-loader.test.ts`, plus any rule-level cases to `tests/validate.test.ts`.

## Adding a recurring resident

Residents are identity-only — name, plate, bio. Per-encounter dialogue lives on the car spec in each day's JSON.

1. Add a `Resident` to `src/data/residents.json` (or the editor's Residents mode) with `id`, `name`, `plate`, `bio`, optional `homeStreetId`.
2. On any day they should appear, add a car spec to that day's JSON with `"residentId": "<id>"`. The plate on the spec wins over the resident's canonical plate if they differ, so usually copy the resident's plate verbatim.
3. Add a `reactive-note` doc to the car's `docs[]` with `from` and a `variants` map. Engine picks a variant based on the player's history with that resident: PCN-last → `negative`, PASS-last → `positive`, empty history → `neutral`. Missing tones fall back to `neutral`; no `neutral` means the note is dropped silently.
4. `judge()` appends each encounter to `state.residentHistory[id]` automatically. History persists across days and save/load. There's no `residentChance` / `residentPool` — residents appear on the days you author them onto.

## Enabling supervisor review on a day

Set `DAYS[i].supervisor = { sampleSize, penaltyPerWrong }`. The end-of-shift flow becomes: SHIFT END (informational) → SUPERVISOR REVIEW (penalty applied, binding rent gate) → NEXT DAY. **The rent gate runs twice** — once on summary (informational), again post-supervisor (binding). This is intentional: the first display shows raw shift result; supervisor adds consequence.

## Save / load

Full `GameState` is persisted to `localStorage["warden:save"]` at end-of-day. On Day 1 the briefing modal shows a CONTINUE PREVIOUS button when a save exists. RESTART clears the save. Bumps to `SAVE_VERSION` in `state.ts` (currently `2`) invalidate old saves — bump it whenever `Car`, `GameState`, or any persisted shape changes.

## Editor

`/editor.html` is a dev-only authoring UI for everything under `src/data/`. It's gated by `import.meta.env.DEV` at runtime and isn't included in `dist/`. Save writes go through a small Vite middleware plugin in `vite.config.ts` (`/__editor/save`, `/__editor/save-residents`, `/__editor/save-streets`, `/__editor/save-tuning`, `/__editor/save-sprites`) which writes the corresponding JSON file.

Five modes via header toggle:

- **Days** — pick a day from the dropdown, edit briefing/streets/rent/cars. `+ New day` button writes the next sequential `dayN.json` skeleton. Live Truth panel shows each car's computed `truth` after parsing.
- **Residents** — list + per-resident form. Validation flags duplicate ids/plates and missing fields.
- **Streets** — list + per-street form (kind dropdown, zone). Delete confirms with a list of every day/car referencing the id; it does NOT auto-rename references.
- **Tuning** — shiftStart (HH:MM) and 3 wage values. Right-side preview shows each day's flawless / all-wrong totals vs rent.
- **Sprites** — sub-toggle for Sprite vs Palette.
  - *Sprite*: dropdown grouped by Cars/Icons/Doc, clickable pixel canvas (left-click paint, right-click erase, drag), `+col/-col/+row/-row` resize, brush swatches showing every palette char. Live SVG preview.
  - *Palette*: per-char hex editor for `base` and `carColours`. Right-side legend tallies pixel usage and flags unused chars.

State is in `src/editor/state.ts`. Selection / mode are persisted to `sessionStorage` so a Vite HMR reload (triggered when the editor saves a watched JSON) lands you back where you were.

## Conventions

- All runtime times are minutes-since-midnight (e.g. `9 * 60` = 09:00). JSON authors times as `"HH:MM"` strings; `parseClock()` converts on load. Format with `fmtClock` helpers in UI.
- Each car carries its own `seenAt`. The HUD clock and `validate()` both read from `car.seenAt` — there is no fixed `PER_CAR_MINUTES` advance any more.
- Plate format (canonical): `AB12 CDE`. Resident plates may use older formats (`K194 ELS`, `LRZ 4421`, `ABC 873L`) — plate is just a string, no parser.
- Fictional council: **Borough of Ashbridge**. Keep all flavour text consistent with that name.
- Keyboard: `P` = PASS, `1/2/3/4` = PCN buttons in `RULES` declaration order, `Enter` = advance briefing/summary, `M` = mute, `?` = key help.
- Wages live in `src/data/tuning.json` (default: +£10 correct, −£8 wrong, +£10 flawless bonus). End-of-day rent is per-day in the day JSON — failing rent → game over.
- **Commits and PRs**: do not add `Co-Authored-By: Claude` trailers (or any AI co-author trailer) and do not add the "🤖 Generated with Claude Code" footer in PR bodies. Author commits cleanly.

## Versioning

Bump `package.json` (and matching `package-lock.json` entries) on meaningful change:
- **Minor** (`0.X.0`) — new Day shipped, new rule/mechanic, new doc type, or other player-visible feature slice.
- **Patch** (`0.x.Y`) — bug fixes, balance tweaks, copy edits, refactors with no player-visible change.
- Pre-1.0 while gameplay scope still in flux. `1.0.0` reserved for the first "complete" release.

Bump as part of the same change that introduces the feature/fix — not a separate commit.

Add a `CHANGELOG.md` entry in the same change. Pending items live under `## [Unreleased]`; on release/tag, move them under the new version heading with the date.

## Known quirks

- `bindGlobalEvents` is guarded by `window.__wardenBound` so Vite HMR re-running `main.ts` doesn't double-bind click/key handlers.
- PCN button order on screen and the `1`/`2`/`3`/`4` keybinds both come from `activeRules(day)` declaration order in `RULES`. To re-order buttons, re-order `RULES` (or change `firstDay`).
- Days are discovered via `import.meta.glob("../../data/days/day*.json")` in both `src/game/days/index.ts` and `src/editor/rawDays.ts`. Drop a new `dayN.json` and it'll appear automatically; in dev, Vite HMR picks it up. In prod the glob is resolved at build time.
- `StreetKind` is a TS union (5 values). Adding a 6th kind needs the union update + `.kerb.<kind>` CSS — the streets editor lets you edit existing streets without code, but a brand-new kind still requires a code change.
- The note system has TWO doc types: plain `note` (static `from`/`text`, authored inline in JSON) and `reactive-note` (variants resolved at `buildCars` time using `residentHistory`). UI only ever sees plain `note` — reactive notes are resolved to plain notes before reaching the renderer.

## Out of scope (future days)

DVLA tax/MOT terminal, forged-permit discrepancies (plate on permit ≠ plate on car already in `permit-zone-match`; can extend to date / holder name), suspended bays, loading bay time windows, school keep-clear zigzags.
