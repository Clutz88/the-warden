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

```
src/
├── main.ts                  entry; binds events, drives day loop
├── style.css
├── game/
│   ├── types.ts             Car, Doc, Rule, GameState, …
│   ├── state.ts             store: getState/setState/subscribe
│   ├── streets.ts           street metadata + streetsForDay(day)
│   ├── rules.ts             RULES registry; activeRules(day) gates by firstDay
│   ├── validate.ts          validate(car, rules, clock) → Violation[]
│   ├── cars.ts              generateCars({day, count, ...}) — procedural
│   ├── days.ts              DAYS[]: briefing, carCount, rent, streets
│   ├── residents.ts         RESIDENTS registry + maybeResident(ctx) draw
│   └── supervisor.ts        reviewShift(log, config, rand) → sample + penalty
├── ui/
│   ├── hud.ts               top bar: day, clock, car #, wages, mistakes
│   ├── scene.ts             street + car (CSS rectangles)
│   ├── docs.ts              dashboard documents
│   ├── rulebook.ts          regulations panel (cumulative across days)
│   ├── actions.ts           PASS + PCN code buttons (filtered by active rules)
│   └── briefing.ts          day-start briefing modal + end-of-day summary
└── tests/
    └── validate.test.ts
```

## Adding a new day / rule

Adding a Day-N mechanic should NOT require engine changes. Pattern:

1. **Rule** — append to `RULES` in `src/game/rules.ts` with `firstDay: N`. The check function returns a `Violation` or `null`.
2. **PCN code** — add entry to `PCN_CODES` and to `CODE_ORDER` in `src/ui/actions.ts`. Map the rule id → code in `renderActions`.
3. **Day def** — add entry to `DAYS` in `src/game/days.ts` with `briefing`, `newRuleSummary`, `carCount`, `streets`, `rent`.
4. **Doc type** (if new) — extend `Doc` union in `types.ts`, render in `ui/docs.ts`, generate in `cars.ts:generateDocs`.
5. **Street kind** (if new) — add to `STREETS` in `streets.ts`, include in `streetsForDay`, style `.kerb.<kind>` in `style.css`.
6. **Test** — add cases to `tests/validate.test.ts`.

## Adding a recurring resident

Residents are NPCs whose plate (and optional dialogue note) appear across days. Engine support lives in `src/game/residents.ts`.

1. Append a `Resident` to `RESIDENTS` in `src/game/residents.ts` with `id`, `name`, `plate`, `bio`.
2. On the day they should appear, set `residentChance` (0–1) and optionally `residentPool: [id, …]` in the `DAYS` entry. Empty pool / 0 chance = never drawn.
3. Optionally attach a `DocNote` to the car via `generateDocs` when the resident is detected (`car.residentId`).
4. The car generator already records `car.residentId`; `judge()` appends to `state.residentHistory[id]` automatically.

## Enabling supervisor review on a day

Set `DAYS[i].supervisor = { sampleSize, penaltyPerWrong }`. The end-of-shift flow becomes: SHIFT END (informational) → SUPERVISOR REVIEW (penalty applied, binding rent gate) → NEXT DAY. **The rent gate runs twice** — once on summary (informational), again post-supervisor (binding). This is intentional: the first display shows raw shift result; supervisor adds consequence.

## Save / load

Full `GameState` is persisted to `localStorage["warden:save"]` at end-of-day. On Day 1 the briefing modal shows a CONTINUE PREVIOUS button when a save exists. RESTART clears the save. Bumps to `SAVE_VERSION` in `state.ts` invalidate old saves.

## Conventions

- All times are minutes-since-midnight (e.g. `9 * 60` = 09:00). Format with `fmtClock` helpers in UI.
- Plate format: `AB12 CDE` (two letters, two digits, space, three letters).
- Fictional council: **Borough of Ashbridge**. Keep all flavour text consistent with that name.
- Keyboard: `P` = PASS, `1/2/3` = PCN buttons in order, `Enter` = advance briefing/summary.
- Player wage: +£10 correct, −£8 wrong. End-of-day rent in `DAYS[i].rent` — fail to make rent → game over.

## Versioning

Bump `package.json` (and matching `package-lock.json` entries) on meaningful change:
- **Minor** (`0.X.0`) — new Day shipped, new rule/mechanic, new doc type, or other player-visible feature slice.
- **Patch** (`0.x.Y`) — bug fixes, balance tweaks, copy edits, refactors with no player-visible change.
- Pre-1.0 while gameplay scope still in flux. `1.0.0` reserved for the first "complete" release.

Bump as part of the same change that introduces the feature/fix — not a separate commit.

Add a `CHANGELOG.md` entry in the same change. Pending items live under `## [Unreleased]`; on release/tag, move them under the new version heading with the date.

## Known quirks

- `bindGlobalEvents` is guarded by `window.__wardenBound` so Vite HMR re-running `main.ts` doesn't double-bind click/key handlers.
- Object literal key order can't be relied on for numeric-string keys (`"01"` non-canonical, `"12"` canonical) — that's why `CODE_ORDER` exists in `actions.ts`.

## Out of scope (future days)

DVLA tax/MOT terminal, forged-permit discrepancies (plate on permit ≠ plate on car already in `permit-zone-match`; can extend to date / holder name), suspended bays, loading bay time windows, school keep-clear zigzags. (Recurring residents and supervisor inspections are now engine-supported but not yet enabled in any `DAYS` entry — content drop pending.)
