import { beforeEach, describe, expect, it } from "vitest";
import { persistState, loadState, clearSave, setState, hydrate, getState } from "../game/state";

function memStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  };
}

beforeEach(() => {
  globalThis.localStorage = memStorage();
  // reset in-memory state
  hydrate({
    day: 1,
    clock: 9 * 60,
    cars: [],
    carIndex: 0,
    wages: 0,
    mistakes: 0,
    log: [],
    phase: "briefing",
    residentHistory: {},
  });
});

describe("save / load", () => {
  it("loadState returns null when no save exists", () => {
    expect(loadState()).toBeNull();
  });

  it("persistState then loadState roundtrips state", () => {
    setState({ day: 2, wages: 42, mistakes: 1 });
    persistState();
    const loaded = loadState();
    expect(loaded).not.toBeNull();
    expect(loaded!.day).toBe(2);
    expect(loaded!.wages).toBe(42);
    expect(loaded!.mistakes).toBe(1);
  });

  it("preserves residentHistory", () => {
    setState({
      residentHistory: {
        r1: [{ day: 1, action: { kind: "pass" }, correct: true }],
      },
    });
    persistState();
    const loaded = loadState();
    expect(loaded!.residentHistory["r1"]).toEqual([
      { day: 1, action: { kind: "pass" }, correct: true },
    ]);
  });

  it("clearSave removes the entry", () => {
    setState({ day: 3 });
    persistState();
    expect(loadState()).not.toBeNull();
    clearSave();
    expect(loadState()).toBeNull();
  });

  it("rejects mismatched save version", () => {
    localStorage.setItem("warden:save", JSON.stringify({ v: 999, state: getState() }));
    expect(loadState()).toBeNull();
  });

  it("rejects corrupt JSON", () => {
    localStorage.setItem("warden:save", "{not json");
    expect(loadState()).toBeNull();
  });
});
