# Changelog

All notable changes to **The Warden**. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/) (pre-1.0 — see CLAUDE.md "Versioning").
## [Unreleased]


## [0.9.1] — 2026-05-04

### Changed
- **Registry refactor — easier content additions.** Three structural cleanups, no player-visible change:
  - PCN `code` + `label` now live directly on each `Rule` in `src/game/rules.ts`. `actions.ts` and the rulebook derive their button order and label list from `RULES` itself; the separate `CODE_ORDER` array, the rule-id → code if-chain in `actions.ts`, and the day-number ladder in `main.ts:activePcnCodes` are gone. `Rule.check` now returns `boolean` (the violation is constructed by `validate.ts` from `rule.code` + `rule.label`).
  - `DAYS[i].streets` now holds `STREETS` ids (e.g. `"highRoad"`), and `streetsForDay(day)` derives the active set from there. The hardcoded day-number ladder in `streets.ts` is gone. Boot-time validation throws on unknown ids.
  - Per-street-kind doc generation moved into a `DOC_BUILDERS: Record<StreetKind, …>` registry in `cars.ts`. The exhaustive Record is the type-level proof that every kind has a builder; the cross-cutting "decoy P&D doc" stays as a post-step.

## [0.9.0] — 2026-05-04

### Added
- **Flawless shift bonus.** Complete a shift with zero mistakes and earn an extra £10, surfaced as its own row on the end-of-shift summary.
- **Loading bay signage.** Bishop's Way now has a white "LOADING" sign sprite on the pavement, matching the visual language of the permit-zone sign.
- **Reactive notes for the full resident roster.** All nine new residents (Priya, Elsie, Owen, Fatima, Jaime, Stuart, Tomasz, Agnes, plus tightened existing notes) now have both `lastWasPcn` and `allPasses` variants, so prior-day decisions echo back across every recurring driver.

### Changed
- **PCN button order matches introduction order** (`01 12 40 25`). Loading bay (introduced Day 6) is now the rightmost button, aligning the on-screen layout with the `1 / 2 / 3 / 4` keybinds.

## [0.8.1] — 2026-05-04

### Added
- **Modal focus trap.** Tab and Shift+Tab cycle within the topmost modal. First focusable element auto-focuses when a modal mounts (briefing, summary, supervisor, gameover, help, stats).
- **Mobile notch support.** `viewport-fit=cover` meta + `env(safe-area-inset-*)` body padding so the app respects iOS notches and rounded-corner cutouts.

### Changed
- **Day 3 — courtesy supervisor review.** Inspector Harding now samples 1 decision at end of Day 3 with a £2 penalty per error, easing the cliff before Day 4's full review (3 sampled, £5 each). Briefing copy updated on both days to reflect the escalation.

## [0.8.0] — 2026-05-04

### Added
- **Mid-shift autosave.** State is now persisted to `localStorage["warden:save"]` after every judgement, not just at briefing/summary. Closing the tab mid-shift no longer loses the day.
- **Career stats** (`src/game/stats.ts` + `warden:stats`). Cumulative across runs: days served, highest day reached, lifetime correct/wrong/wages, accuracy. Surfaced via a CAREER STATS button on the Day 1 briefing (when stats exist) and on the end-of-rotation modal.
- **Keyboard help modal.** New `?` HUD button and `?` keybind open a controls reference (P, 1–4, Enter, M, Esc). Esc closes any open transient overlay.
- **First-shift tutorial card.** Day 1, first car only — a fixed-position card walks the player through reading the scene, docs, and clock before deciding. Auto-clears when the player advances.

### Changed
- Removed legacy `warden:highDay` key in favour of the unified `warden:stats` blob (highDay is one field of it now).

## [0.7.0] — 2026-05-04

### Added
- **Day 6 — Bishop's Way Loading Bay.** New street kind `loading-bay`, new `DocLoadingSlip` doc type, new rule `loading-bay-overstay` activating the previously-dormant PCN code `25`. Drivers must show a loading slip and may not overstay 30 minutes from the slip's arrival time. Supervisor sample rises to 4, penalty £6 per error, rent £90.
- **Resident roster expanded 3 → 12.** New named drivers — Priya Shah, Elsie Whittaker, Owen Pritchard, Fatima Rahman, Jaime Okafor, Stuart McLean, Tomasz Kowalski, Agnes Bellweather. Each carries a baseline note; some have `lastWasPcn` reactive variants. Day 4 / Day 5 / Day 6 resident pools draw from the full registry, with `residentChance` raised to 0.35 / 0.45 / 0.4 respectively.
- **Plate format variety.** Procedural plate generator now produces a mix of modern (LL NN LLL), 1983–2001 prefix style (L NNN LLL), Northern Ireland (LLL NNNN), and pre-1983 suffix style (LLL NNN L) plates.
- **Inspector Harding.** Supervisor reviews now have a named inspector with a conditional opening quip keyed to the error count in the sample.
- **Shift-end quip.** End-of-day summary now includes a tier-based remark ("Immaculate" / "Strong shift" / … / "Word will reach Inspector Harding before sundown.").

### Changed
- Day 4 briefing names Inspector Harding instead of "the council inspector".
- `END OF ROTATION` end-screen replaces the `VERTICAL SLICE COMPLETE` placeholder; copy reflects the six-day arc.

## [0.6.0] — 2026-05-04

### Added
- **Feel & feedback polish pass.** Modal entrance fade/slide, button press transitions, car arrival animation, idle-kerb pulse with "Waiting for next vehicle…" overlay, HUD clock tick, and a centred PASS / PCN / ✗ stamp overlay on every judgement.
- **Synth SFX** (`src/audio/sfx.ts`) — ascending sine ding on correct PASS, lowpass noise stamp on correct PCN, descending square buzzer on mistakes, soft triangle click on briefing/summary buttons. Routed through a new `sfxBus` on the existing audio graph so the M-key mute toggles SFX too.
- End-of-shift and supervisor-review numbers now count up over 600 ms; respects `prefers-reduced-motion`.
- Keyboard `:focus-visible` outlines on all buttons; striped diagonal background on disabled actions.
- Global `prefers-reduced-motion: reduce` guard kills decorative animations and snaps count-ups to final values.

## [0.5.0] — 2026-05-03

### Added
- **Day 5 — Familiar Faces.** Residents return for a second shift; their dashboard notes now react to your Day 4 decisions. PCN'd Margaret? She'll plead about Walter's hospital bill. Let Bernard off? He'll thank you for the leniency. Let Derek off? He'll smirk. Same regulations as Day 4, but `residentChance` rises to 0.4 and rent climbs to £75.
- `pickNote(resident, history)` chooses from an ordered `NoteVariant[]` (first matching predicate wins) with the static `note` as fallback. Predicates are pure functions over `ResidentEncounter[]`; no RNG.
- `GenOpts.residentHistory` plumbed into `generateCars` so per-day note selection has the cross-day context it needs. State already carried `residentHistory` across days; this just exposes it to the generator.

## [0.4.0] — 2026-05-03

### Added
- **Day 4 — Fixed Beat.** Same regulations as Day 3, but the council now assigns recurring residents on your patrol and the supervisor spot-checks 3 of your decisions at end of shift (£5 deduction per missed PCN or wrongful ticket). Rent rises to £60.
- Three named residents — Margaret Dawes (carer, often runs late), Bernard Holland (taxi, paperwork lagging), Derek Foster (plumber, disputes everything). Each carries a one-line note on the dashboard pleading their case. Notes do not change the rules; the supervisor reviews on facts only.

### Changed
- `maybeResident` now treats an empty `residentPool` array as "never draw" (matches the CLAUDE.md contract); `undefined` still means "no whitelist, use full registry".

## [0.3.2]

### Added
- Composed 8-bar lead melody (one bar per chord across the whole progression) replacing the earlier random per-chord phrases. Triggers only when the loop returns to Am, then rests 2–4 full progressions before the next rendition. Melody voice now blends into the pad: lower octave, sub-sine doubling, lowpass at 1.5 kHz, soft vocal-like ADSR with legato tails, and gentle vibrato on long notes. Routed through a feedback delay send for ambience, still gated by master mute.

## [0.3.1]

### Added
- Quiet drum bus layered on the ambient pad — sine-sweep kick on beats 1 & 3, highpass-noise hihat every beat. Routed through the master gain so the mute button silences both. (0.3.1)
- Procedural WebAudio background music: looping minor pad (Am — F — Cmaj7 — Esus4) generated at runtime, lazy-init on first user gesture. HUD 🔊 button and `M` key toggle mute, persisted in `localStorage` (`warden:muted`). (0.3.0)

## [0.2.1] — 2026-05-03

### Added
- Recurring residents with cross-day history (`residentHistory` keyed by `residentId`).
- Supervisor review phase between summary and next-day briefing, with deductions for missed PCNs / wrongful tickets.
- Save/load: shift state and resident history persist across reloads via `localStorage`; briefing offers "Continue" when a save is present.

## [0.2.0] — 2026-05-02

### Added
- Modular sprite rendering for cars, documents, icons, and kerbs — replaces inline DOM with reusable styled components.

## [0.1.0] — 2026-05-02

### Added
- Versioning strategy documented in CLAUDE.md (minor for player-visible feature slices, patch for fixes/tweaks; pre-1.0 while scope in flux).
- Initial version bump from `0.0.0`.

## [0.0.0] — 2026-05-01

### Added
- Initial implementation of "The Warden": Papers-Please-style parking warden game.
- Core engine: `state.ts` pub/sub store, rules registry with per-day gating, validator, procedural car generation, day definitions.
- UI: HUD, scene/kerb rendering, document dashboard, regulations panel, PASS/PCN actions, day briefing + end-of-day summary modals.
- Day 1 (Pay & Display) through Day 3 mechanics with stacking rules.
- CLAUDE.md project documentation covering architecture, conventions, and the "add a new day" workflow.
