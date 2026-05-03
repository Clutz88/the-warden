import { describe, expect, it } from "vitest";
import {
  RESIDENTS,
  maybeResident,
  residentByPlate,
  residentById,
} from "../game/residents";

function constRand(value: number): () => number {
  return () => value;
}

describe("residents registry", () => {
  it("empty by default — engine extension only", () => {
    expect(RESIDENTS.length).toBe(0);
  });

  it("residentByPlate returns null when registry empty", () => {
    expect(residentByPlate("AB12 CDE")).toBeNull();
  });

  it("residentById returns null when registry empty", () => {
    expect(residentById("nope")).toBeNull();
  });
});

describe("maybeResident", () => {
  it("returns null when chance is undefined", () => {
    expect(maybeResident({ rand: constRand(0) })).toBeNull();
  });

  it("returns null when chance is 0", () => {
    expect(maybeResident({ chance: 0, rand: constRand(0) })).toBeNull();
  });

  it("returns null when registry is empty even with chance=1", () => {
    expect(maybeResident({ chance: 1, rand: constRand(0) })).toBeNull();
  });

  it("does not consume RNG when chance is 0 (determinism guard)", () => {
    let calls = 0;
    const rand = () => {
      calls++;
      return 0.5;
    };
    maybeResident({ chance: 0, rand });
    expect(calls).toBe(0);
  });

  it("returns a resident from a non-empty pool when roll passes", () => {
    const stub = {
      id: "test",
      name: "TEST DRIVER",
      plate: "TT01 EST",
      bio: "stub",
    };
    RESIDENTS.push(stub);
    try {
      const got = maybeResident({ chance: 1, rand: constRand(0) });
      expect(got).toBe(stub);
    } finally {
      RESIDENTS.pop();
    }
  });
});
