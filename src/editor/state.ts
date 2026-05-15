import type { CarSpecRaw, DayDefRaw } from "../game/types";

export type EditorState = {
  day: number;
  draft: DayDefRaw;
  selectedCarIdx: number;
  dirty: boolean;
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

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  if (state) l(state);
  return () => listeners.delete(l);
}

function emit(): void {
  if (!state) return;
  for (const l of listeners) l(state);
}
