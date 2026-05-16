import { describe, expect, it } from "vitest";
import { RESIDENTS, residentByPlate, residentById } from "../game/residents";

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
