# The Warden

A Papers-Please-style game where you play a UK parking warden in the fictional **Borough of Ashbridge**. Inspect each parked car, weigh their documents against the day's regulations, and decide: PASS or issue a PCN (Penalty Charge Notice). Each in-game day stacks a new rule on top of the prior days.

## Stack

- Vite + TypeScript (vanilla, no framework)
- DOM-only rendering — programmer art via styled `div`s and SVG sprites. No canvas.
- Vitest for unit tests.
- WebAudio for music (procedural, generated client-side).

## Quickstart

```sh
npm install
npm run dev      # dev server on http://localhost:5174 (or PORT env)
npm run build    # tsc + vite build → dist/
npm run preview  # serve dist/
npx vitest run   # run unit tests
```

## How to play

- **PASS** (`P`) — vehicle is compliant; let it through.
- **PCN** (`1` / `2` / `3` …) — issue the matching penalty charge code from the rulebook.
- **Enter** — advance briefing / summary / supervisor screens.
- **M** — toggle music.

You earn **+£10** for a correct decision and **−£8** for a wrong one. At end-of-shift you must make rent (`DAYS[i].rent`) or the council terminates your contract.

## Project layout

```
src/
├── main.ts               entry; binds events, drives day loop
├── style.css
├── audio/
│   └── music.ts          procedural soundtrack
├── game/
│   ├── types.ts          Car, Doc, Rule, GameState, …
│   ├── state.ts          pub/sub store + save/load
│   ├── streets.ts        street metadata
│   ├── rules.ts          RULES registry; activeRules(day)
│   ├── validate.ts       validate(car, rules, clock) → Violation[]
│   ├── cars.ts           generateCars({day, count, …}) — procedural
│   ├── days.ts           DAYS[]: briefing, carCount, rent, streets
│   ├── residents.ts      RESIDENTS registry + maybeResident()
│   └── supervisor.ts     reviewShift(log, config, rand)
├── ui/
│   ├── hud.ts            top bar
│   ├── scene.ts          street + car
│   ├── docs.ts           dashboard documents
│   ├── rulebook.ts       regulations panel
│   ├── actions.ts        PASS + PCN buttons
│   ├── briefing.ts       briefing / summary / supervisor modals
│   └── sprites/          pixel-art SVG sprites
└── tests/                vitest suites
```

Single source of truth: `src/game/state.ts` — a pub/sub store. UI subscribes; every patch triggers a full re-render.

## Adding content

Each in-game day is defined by data, not engine changes. See [CLAUDE.md](CLAUDE.md) for the full pattern. In short:

- **New rule / day** — append to `RULES`, `DAYS`, `PCN_CODES`. Add a test.
- **New doc type** — extend the `Doc` union, render in `ui/sprites/doc.ts`.
- **New street kind** — add to `STREETS`, style `.kerb-scene.<kind>` in `style.css`.
- **Recurring resident** — push to `RESIDENTS`; opt the day in via `residentChance` / `residentPool`.
- **Supervisor inspection** — set `DAYS[i].supervisor = { sampleSize, penaltyPerWrong }`.

## Save / load

The full `GameState` is persisted to `localStorage["warden:save"]` at the end of each day. The Day 1 briefing offers a CONTINUE PREVIOUS button when a save exists; RESTART clears it.

## Versioning

Pre-1.0 while the gameplay scope is in flux. See `CHANGELOG.md` for the per-release log and [CLAUDE.md](CLAUDE.md#versioning) for the bump policy.
