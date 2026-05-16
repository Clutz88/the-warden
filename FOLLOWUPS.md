# Follow-ups

Audit items from PR #3 that we deliberately didn't ship in v0.10.0. Each one is
small enough to land on its own; rough priority ordered, not strict.

## Correctness

### Reactive notes silently drop when no neutral fallback

`pickReactiveVariant` returns `null` if the requested tone is missing AND there's
no `neutral` variant — the engine then omits the note entirely. An author who
forgets `neutral` on a one-off resident will get no note shown and no warning.

**Fix sketch:** in the editor's day-mode validation panel (or a new
sprite-style check on reactive-note docs), flag any reactive-note without a
`neutral` variant.

### HMR-eats-drafts in the editor

Editor draft state lives in module memory. Unrelated HMR (e.g. someone edits a
TS file) replaces the module and the draft is gone. Only `mode` and selection
survive via `sessionStorage`.

**Fix sketch:** serialise the draft to `sessionStorage` on every keystroke
(debounce to ~200ms), restore on init. The save-then-HMR-reload flow continues
to work because draft is cleared on successful save.

### Game tab doesn't auto-refresh on editor save

Editing in `/editor.html`, save, then switching back to the open game tab — the
game is still using the old data until you manually refresh.

**Fix sketch:** `BroadcastChannel("warden")` ping from `onSave` after a
successful day save → listener in `main.ts` calls `startDay(s.day)` to reload
the current day's data without losing state.

## Authoring UX

### Can't add new sprite entries via the editor

The sprite dropdown only lists existing keys in cars/icons/doc. To add a new
car model you have to hand-edit the JSON.

**Fix sketch:** `+ Add sprite` button in sprite mode. Prompts for category +
key + initial size, creates an empty grid, marks the category dirty, selects
the new entry.

### No rename-with-propagation for ids

Renaming an id (resident, street, sprite key, car model) breaks every reference
to the old id. The editor doesn't propagate the rename.

**Fix sketch:** rename action that scans every relevant file (days JSON for
resident/street, day JSON for car model on `car.model`) and updates references.
Show a diff preview before committing.

### No Ctrl+S / undo / redo

Standard editor expectations. Undo is particularly useful given the canvas's
drag-paint can do mass edits.

**Fix sketch:** maintain a bounded history stack of `EditorState` snapshots in
state.ts. Bind Ctrl+S to onSave, Ctrl+Z to pop, Ctrl+Shift+Z (or Ctrl+Y) to
redo.

## Quality

### JSON has no schema validation at load

`loadDay` parses days carefully and throws on bad shapes. `residents.ts`,
`streets.ts`, `tuning.ts`, and the sprite loaders are bare `as` casts. Bad
JSON only surfaces when something downstream blows up.

**Fix sketch:** either hand-roll validators in each loader (cheap), or adopt a
runtime schema lib (zod / valibot / arktype) for everything under `src/data/`.

### Editor save endpoints have no rate limiting / queueing

Two saves in flight at once race on disk write order. Not exploitable for a
solo dev tool but flagged for completeness.

**Fix sketch:** queue saves per-file in the Vite middleware, or rely on
`requestIdleCallback`-style debouncing in `onSave`.

### CI is minimal

Single Node version (22), no lint, no coverage. Build covers `tsc` so type
errors are caught.

**Fix sketch:** add an `eslint` step (no config exists yet so this is a bigger
investment), add coverage upload (Codecov / Coveralls), matrix across Node
20 + 22.

## Documentation

### README doesn't mention the editor

Newcomer-friendly: a one-liner under "Commands" pointing at
`npm run dev` + `/editor.html`, gated to dev mode.

### No mention of LAN exposure

`vite --host` would expose the save endpoints to anyone on the network. Cheap
README warning is enough.

## Considered but deliberately not in scope

- **Multi-tab edit conflict detection** — solo dev tool, overkill.
- **Sprite canvas zoom/pan** — current 18px cells handle every existing sprite
  comfortably (Discovery is the widest at ~33×17).
- **Authoring text localisation** — single-language game.
