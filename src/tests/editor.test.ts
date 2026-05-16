import { describe, expect, it } from "vitest";
import { paintGridCell, resizeGridString, gridDimensions } from "../editor/gridOps";
import { findBrokenRefs } from "../editor/integrity";
import type { EditorState } from "../editor/state";
import type { DayDefRaw } from "../game/types";
import type { Resident } from "../game/residents";

// --- gridOps ---

describe("paintGridCell", () => {
  const grid = "ABC\nDEF\nGHI";

  it("paints a cell inside the grid", () => {
    expect(paintGridCell(grid, 0, 0, "X")).toBe("XBC\nDEF\nGHI");
    expect(paintGridCell(grid, 2, 1, "Y")).toBe("ABC\nDEY\nGHI");
    expect(paintGridCell(grid, 1, 2, "Z")).toBe("ABC\nDEF\nGZI");
  });

  it("returns the grid unchanged when (x,y) is out of bounds", () => {
    expect(paintGridCell(grid, -1, 0, "X")).toBe(grid);
    expect(paintGridCell(grid, 3, 0, "X")).toBe(grid);
    expect(paintGridCell(grid, 0, -1, "X")).toBe(grid);
    expect(paintGridCell(grid, 0, 3, "X")).toBe(grid);
  });

  it("rejects multi-char brush strokes", () => {
    expect(() => paintGridCell(grid, 0, 0, "")).toThrow();
    expect(() => paintGridCell(grid, 0, 0, "XY")).toThrow();
  });

  it("can paint '.' (erase) and any single char", () => {
    expect(paintGridCell(grid, 0, 0, ".")).toBe(".BC\nDEF\nGHI");
    expect(paintGridCell("X", 0, 0, "Y")).toBe("Y");
  });
});

describe("resizeGridString", () => {
  const grid = "AB\nCD";

  it("adds rows below by padding with '.'", () => {
    expect(resizeGridString(grid, 0, 1)).toBe("AB\nCD\n..");
    expect(resizeGridString(grid, 0, 2)).toBe("AB\nCD\n..\n..");
  });

  it("removes rows from the bottom", () => {
    expect(resizeGridString(grid, 0, -1)).toBe("AB");
  });

  it("never reduces to zero rows", () => {
    expect(resizeGridString(grid, 0, -10)).toBe("AB");
  });

  it("adds columns to the right by padding with '.'", () => {
    expect(resizeGridString(grid, 1, 0)).toBe("AB.\nCD.");
    expect(resizeGridString(grid, 2, 0)).toBe("AB..\nCD..");
  });

  it("removes columns from the right", () => {
    expect(resizeGridString("ABCD\nEFGH", -2, 0)).toBe("AB\nEF");
  });

  it("never reduces to zero columns per row", () => {
    expect(resizeGridString(grid, -10, 0)).toBe("A\nC");
  });

  it("combined growth: extends in both dimensions", () => {
    expect(resizeGridString(grid, 1, 1)).toBe("AB.\nCD.\n...");
  });
});

describe("gridDimensions", () => {
  it("returns the max-row width and the row count", () => {
    expect(gridDimensions("AB\nCDE")).toEqual({ w: 3, h: 2 });
    expect(gridDimensions("X")).toEqual({ w: 1, h: 1 });
    expect(gridDimensions("")).toEqual({ w: 0, h: 1 });
  });
});

// --- integrity ---

function makeState(overrides: Partial<EditorState> = {}): EditorState {
  const baseDay: DayDefRaw = {
    day: 1,
    briefing: "x",
    newRuleSummary: [],
    streets: ["highRoad"],
    rent: 30,
    cars: [],
  };
  const residents: Resident[] = [{ id: "alice", name: "ALICE", plate: "AA00 AAA", bio: "" }];
  return {
    mode: "day",
    day: 1,
    draft: baseDay,
    selectedCarIdx: 0,
    dirty: false,
    residentsDraft: residents,
    selectedResidentIdx: 0,
    residentsDirty: false,
    streetsDraft: [{ id: "highRoad", name: "High Road", kind: "pay-and-display", zone: null }],
    selectedStreetIdx: 0,
    streetsDirty: false,
    tuningDraft: { shiftStart: "09:00", wages: { correct: 10, wrong: -8, flawlessBonus: 10 } },
    tuningDirty: false,
    spritesDraft: { cars: {}, icons: {}, doc: {}, palette: { base: {}, carColours: {} } },
    spritesSubMode: "sprite",
    spriteSelection: { category: "cars", key: "" },
    spriteBrush: "O",
    spritePreviewColour: "Red",
    spritesDirtyCats: { cars: false, icons: false, doc: false, palette: false },
    saveStatus: { kind: "idle" },
    ...overrides,
  };
}

function makeDay(day: number, overrides: Partial<DayDefRaw> = {}): DayDefRaw {
  return {
    day,
    briefing: "x",
    newRuleSummary: [],
    streets: ["highRoad"],
    rent: 30,
    cars: [],
    ...overrides,
  };
}

describe("findBrokenRefs", () => {
  it("returns no issues when all refs resolve", () => {
    const s = makeState({
      draft: makeDay(1, {
        streets: ["highRoad"],
        cars: [{
          seenAt: "09:00", plate: "AB12 CDE", colour: "Red", model: "F",
          street: "highRoad", docs: [],
        }],
      }),
    });
    const issues = findBrokenRefs(s, [1], () => undefined);
    expect(issues).toEqual([]);
  });

  it("flags day.streets entry pointing at a missing street", () => {
    const s = makeState({
      draft: makeDay(1, { streets: ["highRoad", "ghost"] }),
    });
    const issues = findBrokenRefs(s, [1], () => undefined);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("missing street \"ghost\"");
  });

  it("flags car.street pointing at a missing street", () => {
    const s = makeState({
      draft: makeDay(1, {
        cars: [{
          seenAt: "09:00", plate: "AB12 CDE", colour: "Red", model: "F",
          street: "ghost", docs: [],
        }],
      }),
    });
    const issues = findBrokenRefs(s, [1], () => undefined);
    expect(issues.some((i) => i.message.includes("missing street \"ghost\""))).toBe(true);
  });

  it("flags car.residentId pointing at a missing resident", () => {
    const s = makeState({
      draft: makeDay(1, {
        cars: [{
          seenAt: "09:00", plate: "BB00 BBB", colour: "Red", model: "F",
          street: "highRoad", docs: [], residentId: "bob",
        }],
      }),
    });
    const issues = findBrokenRefs(s, [1], () => undefined);
    expect(issues.some((i) => i.message.includes("missing resident \"bob\""))).toBe(true);
  });

  it("uses the draft for the currently-edited day and the lookup for others", () => {
    const s = makeState({
      mode: "day",
      day: 1,
      draft: makeDay(1, { streets: ["highRoad"] }),
    });
    // Day 2 lives in the lookup; it references "ghost" which doesn't exist in streetsDraft.
    const day2 = makeDay(2, { streets: ["ghost"] });
    const issues = findBrokenRefs(s, [1, 2], (n) => (n === 2 ? day2 : undefined));
    expect(issues.some((i) => i.scope === "Day 2")).toBe(true);
    expect(issues.some((i) => i.scope === "Day 1")).toBe(false);
  });

  it("ignores residents mode's day == 1 — still uses RAW lookup for ALL days", () => {
    // When mode !== "day", the draft is never consulted for any day.
    const s = makeState({
      mode: "residents",
      // The draft itself is fine but we won't read it.
      draft: makeDay(1, { streets: ["highRoad"] }),
    });
    const day1raw = makeDay(1, { streets: ["ghost"] });
    const issues = findBrokenRefs(s, [1], (n) => (n === 1 ? day1raw : undefined));
    expect(issues).toHaveLength(1);
    expect(issues[0]!.scope).toBe("Day 1");
  });
});
