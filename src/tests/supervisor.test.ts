import { describe, expect, it } from "vitest";
import { reviewShift } from "../game/supervisor";
import type { ShiftLog, Car } from "../game/types";

function fakeCar(plate: string): Car {
  return {
    id: plate,
    plate,
    colour: "Red",
    model: "Test",
    street: { id: "x", name: "x", kind: "pay-and-display", zone: null },
    docs: [],
    truth: [],
    seenAt: 9 * 60,
  };
}

function entry(plate: string, correct: boolean): ShiftLog {
  return {
    car: fakeCar(plate),
    truth: [],
    playerAction: { kind: "pass" },
    correct,
  };
}

describe("reviewShift", () => {
  it("penalty = wrongInSample * penaltyPerWrong", () => {
    const log = [entry("A", true), entry("B", false), entry("C", false), entry("D", true)];
    const r = reviewShift(log, { sampleSize: 4, penaltyPerWrong: 5 }, () => 0);
    expect(r.sample.length).toBe(4);
    expect(r.wrongInSample).toBe(2);
    expect(r.penalty).toBe(10);
  });

  it("clamps sampleSize to log length", () => {
    const log = [entry("A", false)];
    const r = reviewShift(log, { sampleSize: 10, penaltyPerWrong: 3 }, () => 0);
    expect(r.sample.length).toBe(1);
    expect(r.penalty).toBe(3);
  });

  it("sample contains no duplicates", () => {
    const log = [
      entry("A", false),
      entry("B", false),
      entry("C", true),
      entry("D", true),
      entry("E", false),
    ];
    let n = 0;
    const r = reviewShift(log, { sampleSize: 3, penaltyPerWrong: 1 }, () => {
      const v = (n * 0.31) % 1;
      n++;
      return v;
    });
    const plates = r.sample.map((l) => l.car.plate);
    expect(new Set(plates).size).toBe(plates.length);
  });

  it("zero penalty when no mistakes in sample", () => {
    const log = [entry("A", true), entry("B", true)];
    const r = reviewShift(log, { sampleSize: 2, penaltyPerWrong: 100 }, () => 0);
    expect(r.penalty).toBe(0);
  });
});
