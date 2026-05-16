import type { CarSpecRaw, DayDefRaw, Street, TuningRaw } from "../game/types";
import type { Resident } from "../game/residents";
import { paintGridCell, resizeGridString } from "./gridOps";

export type EditorMode = "day" | "residents" | "streets" | "tuning" | "sprites";

export type SpritesDraft = {
  cars: Record<string, string>;
  icons: Record<string, string>;
  doc: Record<string, string>;
  palette: {
    base: Record<string, string>;
    carColours: Record<string, string>;
  };
};

export type SpriteSelection =
  | { category: "cars"; key: string }
  | { category: "icons"; key: string }
  | { category: "doc"; key: string };

export type SpritesSubMode = "sprite" | "palette";

export type EditorState = {
  mode: EditorMode;
  // Day mode
  day: number;
  draft: DayDefRaw;
  selectedCarIdx: number;
  dirty: boolean;
  // Residents mode
  residentsDraft: Resident[];
  selectedResidentIdx: number;
  residentsDirty: boolean;
  // Streets mode
  streetsDraft: Street[];
  selectedStreetIdx: number;
  streetsDirty: boolean;
  // Tuning mode
  tuningDraft: TuningRaw;
  tuningDirty: boolean;
  // Sprites mode
  spritesDraft: SpritesDraft;
  spritesSubMode: SpritesSubMode;
  spriteSelection: SpriteSelection;
  spriteBrush: string; // active palette char, "." = erase
  spritePreviewColour: string; // car body colour name for preview
  spritesDirtyCats: { cars: boolean; icons: boolean; doc: boolean; palette: boolean };
  // Shared
  saveStatus: { kind: "idle" | "saving" | "ok" | "err"; message?: string };
};

export function spritesAnyDirty(s: EditorState): boolean {
  const d = s.spritesDirtyCats;
  return d.cars || d.icons || d.doc || d.palette;
}

export type Listener = (s: EditorState) => void;

const listeners: Set<Listener> = new Set();
let state: EditorState | null = null;

export function initState(initial: EditorState): void {
  state = initial;
  emit();
}

export function getState(): EditorState {
  if (!state) throw new Error("editor state not initialised");
  return state;
}

export function setState(patch: Partial<EditorState>): void {
  if (!state) throw new Error("editor state not initialised");
  state = { ...state, ...patch };
  emit();
}

export function updateDraft(fn: (d: DayDefRaw) => void): void {
  const s = getState();
  const draft = structuredClone(s.draft);
  fn(draft);
  setState({ draft, dirty: true, saveStatus: { kind: "idle" } });
}

export function updateCar(idx: number, fn: (c: CarSpecRaw) => void): void {
  updateDraft((d) => {
    const car = d.cars[idx];
    if (car) fn(car);
  });
}

export function switchDay(day: number, raw: DayDefRaw): void {
  setState({
    day,
    draft: structuredClone(raw),
    selectedCarIdx: 0,
    dirty: false,
    saveStatus: { kind: "idle" },
  });
}

export function switchMode(mode: EditorMode): void {
  setState({ mode, saveStatus: { kind: "idle" } });
}

export function updateResidents(fn: (rs: Resident[]) => void): void {
  const s = getState();
  const residentsDraft = structuredClone(s.residentsDraft);
  fn(residentsDraft);
  setState({ residentsDraft, residentsDirty: true, saveStatus: { kind: "idle" } });
}

export function updateResident(idx: number, fn: (r: Resident) => void): void {
  updateResidents((rs) => {
    const r = rs[idx];
    if (r) fn(r);
  });
}

export function updateStreets(fn: (xs: Street[]) => void): void {
  const s = getState();
  const streetsDraft = structuredClone(s.streetsDraft);
  fn(streetsDraft);
  setState({ streetsDraft, streetsDirty: true, saveStatus: { kind: "idle" } });
}

export function updateStreet(idx: number, fn: (s: Street) => void): void {
  updateStreets((xs) => {
    const x = xs[idx];
    if (x) fn(x);
  });
}

export function updateTuning(fn: (t: TuningRaw) => void): void {
  const s = getState();
  const tuningDraft = structuredClone(s.tuningDraft);
  fn(tuningDraft);
  setState({ tuningDraft, tuningDirty: true, saveStatus: { kind: "idle" } });
}

type SpritesCategory = keyof SpritesDraft;

export function updateSprites(
  category: SpritesCategory,
  fn: (d: SpritesDraft[SpritesCategory]) => void,
): void {
  const s = getState();
  const spritesDraft = structuredClone(s.spritesDraft);
  fn(spritesDraft[category] as never);
  const spritesDirtyCats = { ...s.spritesDirtyCats, [category]: true };
  setState({ spritesDraft, spritesDirtyCats, saveStatus: { kind: "idle" } });
}

export function updateGridCell(
  category: "cars" | "icons" | "doc",
  key: string,
  x: number,
  y: number,
  ch: string,
): void {
  updateSprites(category, (d) => {
    const map = d as Record<string, string>;
    const grid = map[key];
    if (!grid) return;
    map[key] = paintGridCell(grid, x, y, ch);
  });
}

export function resizeGrid(
  category: "cars" | "icons" | "doc",
  key: string,
  deltaW: number,
  deltaH: number,
): void {
  updateSprites(category, (d) => {
    const map = d as Record<string, string>;
    const grid = map[key];
    if (!grid) return;
    map[key] = resizeGridString(grid, deltaW, deltaH);
  });
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  if (state) l(state);
  return () => listeners.delete(l);
}

function emit(): void {
  if (!state) return;
  for (const l of listeners) l(state);
}
