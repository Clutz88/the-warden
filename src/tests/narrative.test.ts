import { describe, expect, it } from "vitest";
import { buildCars, toneFromHistory, pickReactiveVariant } from "../game/cars";
import { DAYS } from "../game/days";
import { residentById } from "../game/residents";
import type { CarSpec, DocReactiveNote, ResidentEncounter } from "../game/types";

const day4 = DAYS.find((d) => d.day === 4)!;
const day5 = DAYS.find((d) => d.day === 5)!;

describe("Authored day 4 narrative", () => {
  it("has supervisor + at least one resident-tagged car", () => {
    expect(day4.supervisor).toEqual({ sampleSize: 3, penaltyPerWrong: 5 });
    const residents = day4.cars.filter((c) => c.residentId);
    expect(residents.length).toBeGreaterThan(0);
  });

  it("every residentId on day 4 resolves to a Resident", () => {
    for (const car of day4.cars) {
      if (car.residentId) {
        expect(residentById(car.residentId), `missing resident ${car.residentId}`).not.toBeNull();
      }
    }
  });

  it("every resident-tagged car on day 4 carries a reactive-note doc", () => {
    for (const car of day4.cars) {
      if (!car.residentId) continue;
      const rn = car.docs.find((d) => d.type === "reactive-note");
      expect(rn, `${car.plate} missing reactive-note`).toBeTruthy();
    }
  });

  it("with no history, resident cars render the neutral note variant", () => {
    const built = buildCars(day4.cars, 4);
    for (const car of built) {
      if (!car.residentId) continue;
      const spec = day4.cars.find((c) => c.residentId === car.residentId)!;
      const rn = spec.docs.find((d) => d.type === "reactive-note") as DocReactiveNote | undefined;
      if (!rn) continue;
      const built_note = car.docs.find((d) => d.type === "note");
      expect(built_note, `${car.plate} note missing`).toBeTruthy();
      if (built_note && built_note.type === "note") {
        expect(built_note.text).toBe(rn.variants.neutral);
        expect(built_note.from).toBe(rn.from);
      }
    }
  });
});

describe("Day 5 narrative", () => {
  it("has supervisor + resident cars", () => {
    expect(day5.supervisor).toBeDefined();
    expect(day5.cars.filter((c) => c.residentId).length).toBeGreaterThan(0);
  });
});

describe("toneFromHistory classifier", () => {
  it("returns neutral on empty history", () => {
    expect(toneFromHistory(undefined)).toBe("neutral");
    expect(toneFromHistory([])).toBe("neutral");
  });

  it("returns positive when last action was PASS", () => {
    const h: ResidentEncounter[] = [{ day: 4, action: { kind: "pass" }, correct: true }];
    expect(toneFromHistory(h)).toBe("positive");
  });

  it("returns negative when last action was PCN", () => {
    const h: ResidentEncounter[] = [
      { day: 4, action: { kind: "pass" }, correct: true },
      { day: 4, action: { kind: "pcn", code: "40" }, correct: true },
    ];
    expect(toneFromHistory(h)).toBe("negative");
  });
});

describe("pickReactiveVariant", () => {
  const doc: DocReactiveNote = {
    type: "reactive-note",
    from: "X",
    variants: {
      neutral: "n",
      positive: "p",
      negative: "ng",
    },
  };

  it("returns the requested tone variant when present", () => {
    expect(pickReactiveVariant(doc, "positive")).toBe("p");
    expect(pickReactiveVariant(doc, "negative")).toBe("ng");
    expect(pickReactiveVariant(doc, "neutral")).toBe("n");
  });

  it("falls back to neutral when requested tone missing", () => {
    const partial: DocReactiveNote = {
      type: "reactive-note",
      from: "X",
      variants: { neutral: "n" },
    };
    expect(pickReactiveVariant(partial, "positive")).toBe("n");
    expect(pickReactiveVariant(partial, "negative")).toBe("n");
  });

  it("returns null when no variants match", () => {
    const empty: DocReactiveNote = { type: "reactive-note", from: "X", variants: {} };
    expect(pickReactiveVariant(empty, "positive")).toBeNull();
  });
});

describe("buildCars resolves reactive-note based on history", () => {
  function spec(residentId: string, variants: DocReactiveNote["variants"]): CarSpec {
    const r = residentById(residentId)!;
    return {
      seenAt: 9 * 60 + 10,
      plate: r.plate,
      colour: "Silver",
      model: "Test",
      street: "churchLane",
      docs: [{ type: "reactive-note", from: r.name, variants }],
      residentId: r.id,
    };
  }

  it("picks negative variant when last encounter was PCN", () => {
    const built = buildCars(
      [
        spec("margaret-dawes", {
          neutral: "baseline",
          positive: "thanks",
          negative: "Walter's hospital bill",
        }),
      ],
      5,
      {
        "margaret-dawes": [{ day: 4, action: { kind: "pcn", code: "40" }, correct: true }],
      },
    );
    const note = built[0]!.docs.find((d) => d.type === "note");
    expect(note && note.type === "note" && note.text).toBe("Walter's hospital bill");
  });

  it("picks positive variant when last encounter was PASS", () => {
    const built = buildCars(
      [
        spec("bernard-holland", {
          neutral: "baseline",
          positive: "leniency, thanks",
          negative: "your fault",
        }),
      ],
      5,
      {
        "bernard-holland": [{ day: 4, action: { kind: "pass" }, correct: true }],
      },
    );
    const note = built[0]!.docs.find((d) => d.type === "note");
    expect(note && note.type === "note" && note.text).toBe("leniency, thanks");
  });

  it("picks neutral on empty history", () => {
    const built = buildCars(
      [spec("derek-foster", { neutral: "baseline", positive: "p", negative: "n" })],
      5,
    );
    const note = built[0]!.docs.find((d) => d.type === "note");
    expect(note && note.type === "note" && note.text).toBe("baseline");
  });

  it("drops the note entirely if no matching variant and no neutral fallback", () => {
    const r = residentById("priya-shah")!;
    const built = buildCars(
      [
        {
          seenAt: 9 * 60,
          plate: r.plate,
          colour: "Blue",
          model: "Mini",
          street: "victoriaTerr",
          docs: [{ type: "reactive-note", from: r.name, variants: { positive: "only positive" } }],
          residentId: r.id,
        },
      ],
      5,
      { "priya-shah": [{ day: 4, action: { kind: "pcn", code: "12" }, correct: true }] },
    );
    expect(built[0]!.docs.find((d) => d.type === "note")).toBeUndefined();
  });
});
