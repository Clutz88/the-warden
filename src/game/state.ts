import type { GameState } from "./types";

type Listener = (s: GameState) => void;

const listeners: Set<Listener> = new Set();

let state: GameState = {
  day: 1,
  clock: 9 * 60,
  cars: [],
  carIndex: 0,
  wages: 0,
  mistakes: 0,
  log: [],
  phase: "briefing",
};

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
  state = {
    day: 1,
    clock: 9 * 60,
    cars: [],
    carIndex: 0,
    wages: 0,
    mistakes: 0,
    log: [],
    phase: "briefing",
  };
  listeners.forEach((l) => l(state));
}
