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
  it("contains the Day 4 narrative cast", () => {
    const ids = RESIDENTS.map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining(["margaret-dawes", "bernard-holland", "derek-foster"]),
    );
  });

  it("each resident has a unique plate", () => {
    const plates = RESIDENTS.map((r) => r.plate);
    expect(new Set(plates).size).toBe(plates.length);
  });

  it("residentByPlate finds known residents", () => {
    const r = residentByPlate("MD51 GET");
    expect(r?.id).toBe("margaret-dawes");
  });

  it("residentByPlate returns null for unknown plates", () => {
    expect(residentByPlate("ZZ99 ZZZ")).toBeNull();
  });

  it("residentById round-trips", () => {
    expect(residentById("derek-foster")?.name).toBe("DEREK FOSTER");
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

  it("returns null when pool is empty whitelist", () => {
    expect(
      maybeResident({ chance: 1, pool: [], rand: constRand(0) }),
    ).toBeNull();
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

  it("returns the only pool member when chance=1", () => {
    const got = maybeResident({
      chance: 1,
      pool: ["bernard-holland"],
      rand: constRand(0),
    });
    expect(got?.id).toBe("bernard-holland");
  });

  it("returns null on a chance roll that fails", () => {
    // chance=0.3, rand returns 0.5 → 0.5 >= 0.3 → null
    const got = maybeResident({
      chance: 0.3,
      pool: ["margaret-dawes"],
      rand: constRand(0.5),
    });
    expect(got).toBeNull();
  });
});
