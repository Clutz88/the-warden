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

describe("Day 1 authored sequence", () => {
  const day1 = DAYS[0]!;

  it("loaded cars match the authored shape", () => {
    expect(day1.cars).toBeDefined();
    expect(day1.cars!.length).toBe(6);
    expect(day1.cars![0]!.seenAt).toBe(9 * 60);
    expect(day1.cars![0]!.plate).toBe("AB12 CDE");
  });

  it("seenAt is monotonic", () => {
    const cars = day1.cars!;
    for (let i = 1; i < cars.length; i++) {
      expect(cars[i]!.seenAt).toBeGreaterThanOrEqual(cars[i - 1]!.seenAt);
    }
  });

  it("buildCars produces the expected per-car truth", () => {
    const built = buildCars(day1.cars!, 1);
    const codes = built.map((c) => c.truth.map((t) => t.code).join(","));
    expect(codes).toEqual([
      "",      // valid PD
      "01",    // expired
      "01",    // no ticket
      "",      // valid PD
      "01",    // expired
      "",      // valid PD
    ]);
  });
});
