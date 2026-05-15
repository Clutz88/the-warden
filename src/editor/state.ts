import type { CarSpecRaw, DayDefRaw } from "../game/types";
import type { Resident } from "../game/residents";

export type EditorMode = "day" | "residents";

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
  // Shared
  saveStatus: { kind: "idle" | "saving" | "ok" | "err"; message?: string };
};

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

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  if (state) l(state);
  return () => listeners.delete(l);
}

function emit(): void {
  if (!state) return;
  for (const l of listeners) l(state);
}
