import { describe, expect, it } from "vitest";
import { DAYS, parseClock } from "../game/days";
import { buildCars } from "../game/cars";

describe("parseClock", () => {
  it("converts HH:MM to minutes since midnight", () => {
    expect(parseClock("00:00")).toBe(0);
    expect(parseClock("09:00")).toBe(540);
    expect(parseClock("09:30")).toBe(570);
    expect(parseClock("23:59")).toBe(23 * 60 + 59);
  });

  it("throws on malformed input", () => {
    expect(() => parseClock("9:30")).toThrow();
    expect(() => parseClock("25:00")).toThrow();
    expect(() => parseClock("09:60")).toThrow();
    expect(() => parseClock("nope")).toThrow();
  });
});

describe("Authored day sequences", () => {
  it("every day loads with cars[] and monotonic seenAt", () => {
    for (const def of DAYS) {
      expect(def.cars, `day ${def.day} missing cars`).toBeDefined();
      const cars = def.cars!;
      expect(cars.length).toBeGreaterThan(0);
      for (let i = 1; i < cars.length; i++) {
        expect(cars[i]!.seenAt, `day ${def.day} car ${i} seenAt regression`).toBeGreaterThanOrEqual(
          cars[i - 1]!.seenAt,
        );
      }
    }
  });

  const expected: Record<number, string[]> = {
    1: ["", "01", "01", "", "01", ""],
    2: ["", "", "01", "12", "12", "01", "", "12"],
    3: ["", "", "", "40", "01", "12", "40", "", "40", ""],
    4: ["", "", "", "01", "12", "40", "01", "", "40", ""],
    5: ["", "", "01", "01", "12", "", "40", "", "", "12", "", "40"],
    6: ["", "", "", "25", "", "25", "01", "12", "40", "", "", ""],
  };

  for (const def of DAYS) {
    it(`day ${def.day} buildCars truth matches authored intent`, () => {
      const built = buildCars(def.cars!, def.day);
      const codes = built.map((c) => c.truth.map((t) => t.code).join(","));
      expect(codes).toEqual(expected[def.day]);
    });
  }
});
