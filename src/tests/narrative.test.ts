import { describe, expect, it } from "vitest";
import { generateCars } from "../game/cars";
import { DAYS } from "../game/days";
import { residentById, pickNote } from "../game/residents";
import type { ResidentEncounter } from "../game/types";

const day4 = DAYS.find((d) => d.day === 4);
const day5 = DAYS.find((d) => d.day === 5);

describe("Day 4 narrative drop", () => {
  it("Day 4 exists with supervisor + resident config", () => {
    expect(day4).toBeDefined();
    expect(day4!.supervisor).toEqual({ sampleSize: 3, penaltyPerWrong: 5 });
    expect(day4!.residentChance).toBeGreaterThan(0);
    expect(day4!.residentPool?.length).toBeGreaterThan(0);
  });

  it("each pool entry resolves to a Resident", () => {
    for (const id of day4!.residentPool ?? []) {
      expect(residentById(id), `missing resident ${id}`).not.toBeNull();
    }
  });

  it("residents have baseline notes", () => {
    for (const id of day4!.residentPool ?? []) {
      expect(residentById(id)?.note).toBeTruthy();
    }
  });

  it("with no history, resident cars carry the baseline note text", () => {
    const cars = generateCars({
      day: 4,
      count: 30,
      shiftStart: 9 * 60,
      seed: 12345,
    });
    const residentCars = cars.filter((c) => c.residentId);
    expect(residentCars.length).toBeGreaterThan(0);
    for (const car of residentCars) {
      const resident = residentById(car.residentId!);
      expect(car.plate).toBe(resident!.plate);
      const noteDoc = car.docs.find((d) => d.type === "note");
      expect(noteDoc, `expected note doc on ${car.plate}`).toBeTruthy();
      if (noteDoc && noteDoc.type === "note") {
        expect(noteDoc.from).toBe(resident!.name);
        expect(noteDoc.text).toBe(resident!.note);
      }
    }
  });
});

describe("Day 5 reactive notes", () => {
  it("Day 5 exists with supervisor + resident config", () => {
    expect(day5).toBeDefined();
    expect(day5!.supervisor).toBeDefined();
    expect(day5!.residentChance).toBeGreaterThan(0);
  });
});

describe("pickNote", () => {
  const margaret = residentById("margaret-dawes")!;
  const bernard = residentById("bernard-holland")!;
  const derek = residentById("derek-foster")!;

  const enc = (kind: "pass" | "pcn", day = 4): ResidentEncounter => ({
    day,
    action: kind === "pass" ? { kind: "pass" } : { kind: "pcn", code: "01" },
    correct: true,
  });

  it("returns baseline when history is empty", () => {
    expect(pickNote(margaret, [])).toBe(margaret.note);
    expect(pickNote(bernard, [])).toBe(bernard.note);
    expect(pickNote(derek, [])).toBe(derek.note);
  });

  it("returns angry variant when last action was PCN", () => {
    const text = pickNote(margaret, [enc("pcn")]);
    expect(text).toContain("Walter's hospital bill");

    expect(pickNote(bernard, [enc("pass"), enc("pcn")])).toContain("£80 ticket");
    expect(pickNote(derek, [enc("pcn")])).toContain("solicitor");
  });

  it("returns grateful variant when every encounter was PASS", () => {
    expect(pickNote(margaret, [enc("pass"), enc("pass")])).toContain("God bless");
    expect(pickNote(bernard, [enc("pass")])).toContain("leniency");
    expect(pickNote(derek, [enc("pass")])).toContain("Right answer");
  });

  it("falls through to baseline when a resident has no notes array", () => {
    const stub = {
      id: "stub",
      name: "STUB",
      plate: "ZZ00 ZZZ",
      bio: "no variants",
      note: "static",
    };
    expect(pickNote(stub, [enc("pcn")])).toBe("static");
  });

  it("returns null when resident has neither note nor notes", () => {
    const stub = {
      id: "void",
      name: "VOID",
      plate: "VV00 VVV",
      bio: "nothing",
    };
    expect(pickNote(stub, [])).toBeNull();
  });
});

describe("generateCars wires history into note selection", () => {
  it("Margaret receives her angry variant when PCN'd on Day 4", () => {
    const cars = generateCars({
      day: 5,
      count: 40,
      shiftStart: 9 * 60,
      seed: 98765,
      residentHistory: {
        "margaret-dawes": [
          { day: 4, action: { kind: "pcn", code: "40" }, correct: true },
        ],
      },
    });
    const margaretCars = cars.filter((c) => c.residentId === "margaret-dawes");
    expect(margaretCars.length).toBeGreaterThan(0);
    for (const car of margaretCars) {
      const note = car.docs.find((d) => d.type === "note");
      expect(note).toBeTruthy();
      if (note && note.type === "note") {
        expect(note.text).toContain("Walter's hospital bill");
      }
    }
  });

  it("Bernard receives his grateful variant when only PASS'd on Day 4", () => {
    const cars = generateCars({
      day: 5,
      count: 40,
      shiftStart: 9 * 60,
      seed: 13579,
      residentHistory: {
        "bernard-holland": [
          { day: 4, action: { kind: "pass" }, correct: false },
        ],
      },
    });
    const bernardCars = cars.filter((c) => c.residentId === "bernard-holland");
    expect(bernardCars.length).toBeGreaterThan(0);
    for (const car of bernardCars) {
      const note = car.docs.find((d) => d.type === "note");
      expect(note).toBeTruthy();
      if (note && note.type === "note") {
        expect(note.text).toContain("leniency");
      }
    }
  });
});
