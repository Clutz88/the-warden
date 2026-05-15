import { describe, expect, it } from "vitest";
import { RULES, activeRules } from "../game/rules";
import { validate } from "../game/validate";
import { STREETS } from "../game/streets";
import { DAYS } from "../game/days";
import type { Car, Doc } from "../game/types";

const SHIFT_START = 9 * 60;
const NOW = SHIFT_START + 30;

function carOn(streetId: keyof typeof STREETS, docs: Doc[], plate = "AB12 CDE"): Car {
  return {
    id: "t",
    plate,
    colour: "Red",
    model: "Ford Fiesta",
    street: STREETS[streetId]!,
    docs,
    truth: [],
    seenAt: NOW,
  };
}

describe("Day 1 — pay & display", () => {
  const rules = activeRules(1);

  it("PCN when no P&D ticket on a P&D street", () => {
    const v = validate(carOn("highRoad", []), rules, NOW);
    expect(v.map((x) => x.code)).toEqual(["01"]);
  });

  it("PCN when P&D ticket expired", () => {
    const v = validate(
      carOn("highRoad", [{ type: "pd", zone: null, expiresAt: NOW - 10 }]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["01"]);
  });

  it("PASS when P&D ticket still valid", () => {
    const v = validate(
      carOn("highRoad", [{ type: "pd", zone: null, expiresAt: NOW + 60 }]),
      rules,
      NOW,
    );
    expect(v).toEqual([]);
  });
});

describe("Day 2 — permit zone", () => {
  const rules = activeRules(2);

  it("PCN when no permit on permit street", () => {
    const v = validate(carOn("abbeyClose", []), rules, NOW);
    expect(v.map((x) => x.code)).toEqual(["12"]);
  });

  it("PCN when permit zone wrong", () => {
    const v = validate(
      carOn("abbeyClose", [
        { type: "permit", zone: "B", plate: "AB12 CDE", validUntil: "x" },
      ]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["12"]);
  });

  it("PCN when permit plate doesn't match car plate", () => {
    const v = validate(
      carOn(
        "abbeyClose",
        [{ type: "permit", zone: "A", plate: "ZZ99 ZZZ", validUntil: "x" }],
        "AB12 CDE",
      ),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["12"]);
  });

  it("PASS when permit zone + plate match", () => {
    const v = validate(
      carOn("abbeyClose", [
        { type: "permit", zone: "A", plate: "AB12 CDE", validUntil: "x" },
      ]),
      rules,
      NOW,
    );
    expect(v).toEqual([]);
  });

  it("Day 1 P&D rules still active on Day 2 — expired ticket still PCN", () => {
    const v = validate(
      carOn("highRoad", [{ type: "pd", zone: null, expiresAt: NOW - 5 }]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["01"]);
  });
});

describe("Day 3 — double yellows + blue badge", () => {
  const rules = activeRules(3);

  it("PCN on double yellows with no badge", () => {
    const v = validate(carOn("churchLane", []), rules, NOW);
    expect(v.map((x) => x.code)).toEqual(["40"]);
  });

  it("PCN on double yellows when badge clock not shown", () => {
    const v = validate(
      carOn("churchLane", [
        {
          type: "blue-badge",
          holder: "X",
          validUntil: "x",
          clockShown: false,
          clockSetAt: null,
        },
      ]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["40"]);
  });

  it("PCN when blue badge parked >3h", () => {
    const v = validate(
      carOn("churchLane", [
        {
          type: "blue-badge",
          holder: "X",
          validUntil: "x",
          clockShown: true,
          clockSetAt: NOW - 200,
        },
      ]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["40"]);
  });

  it("PASS with blue badge + clock under 3h", () => {
    const v = validate(
      carOn("churchLane", [
        {
          type: "blue-badge",
          holder: "X",
          validUntil: "x",
          clockShown: true,
          clockSetAt: NOW - 30,
        },
      ]),
      rules,
      NOW,
    );
    expect(v).toEqual([]);
  });
});

describe("Day 6 — loading bay", () => {
  const rules = activeRules(6);

  it("PCN when no loading slip on a loading bay", () => {
    const v = validate(carOn("bishopsWay", []), rules, NOW);
    expect(v.map((x) => x.code)).toEqual(["25"]);
  });

  it("PCN when loading slip is over 30 minutes old", () => {
    const v = validate(
      carOn("bishopsWay", [
        { type: "loading-slip", firm: "PARCELFLEET LTD", arrivedAt: NOW - 45 },
      ]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["25"]);
  });

  it("PASS with a fresh loading slip", () => {
    const v = validate(
      carOn("bishopsWay", [
        { type: "loading-slip", firm: "PARCELFLEET LTD", arrivedAt: NOW - 10 },
      ]),
      rules,
      NOW,
    );
    expect(v).toEqual([]);
  });

  it("Day 1–5 rules still active alongside loading bay", () => {
    const v = validate(
      carOn("highRoad", [{ type: "pd", zone: null, expiresAt: NOW - 5 }]),
      rules,
      NOW,
    );
    expect(v.map((x) => x.code)).toEqual(["01"]);
  });
});

describe("Registry integrity", () => {
  it("RULES carries the expected PCN codes", () => {
    expect(RULES.map((r) => r.code).sort()).toEqual(["01", "12", "25", "40"]);
  });

  it("every DAYS[i].streets id resolves in STREETS", () => {
    for (const d of DAYS) {
      for (const id of d.streets) {
        expect(STREETS[id], `day ${d.day}: unknown street "${id}"`).toBeDefined();
      }
    }
  });
});
