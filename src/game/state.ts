import type { GameState } from "./types";

type Listener = (s: GameState) => void;

const listeners: Set<Listener> = new Set();

const SAVE_KEY = "warden:save";
const SAVE_VERSION = 1;

function initialState(): GameState {
  return {
    day: 1,
    clock: 9 * 60,
    cars: [],
    carIndex: 0,
    wages: 0,
    mistakes: 0,
    log: [],
    phase: "briefing",
    residentHistory: {},
  };
}

let state: GameState = initialState();

export function getState(): GameState {
  return state;
}

export function setState(patch: Partial<GameState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => listeners.delete(l);
}

export function resetGame(): void {
  state = initialState();
  clearSave();
  listeners.forEach((l) => l(state));
}

export function persistState(): void {
  try {
    const payload = { v: SAVE_VERSION, state };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {}
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v?: number; state?: GameState };
    if (parsed?.v !== SAVE_VERSION || !parsed.state) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

export function hydrate(s: GameState): void {
  state = s;
  listeners.forEach((l) => l(state));
}
