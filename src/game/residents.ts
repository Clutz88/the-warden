import type { ResidentEncounter } from "./types";

export type NoteVariant = {
  when: (h: ResidentEncounter[]) => boolean;
  text: string;
};

export type Resident = {
  id: string;
  name: string;
  plate: string;
  bio: string;
  homeStreetId?: string;
  note?: string;
  notes?: NoteVariant[];
};

const lastWasPcn = (h: ResidentEncounter[]): boolean =>
  h.length > 0 && h[h.length - 1]!.action.kind === "pcn";

const allPasses = (h: ResidentEncounter[]): boolean =>
  h.length > 0 && h.every((e) => e.action.kind === "pass");

export const RESIDENTS: Resident[] = [
  {
    id: "margaret-dawes",
    name: "MARGARET DAWES",
    plate: "MD51 GET",
    bio: "Carer for her husband Walter. Hospital appointments at St. Hilda's often overrun.",
    homeStreetId: "churchLn",
    note: "Sorry — appointment ran over. Walter needed help back to the car.",
    notes: [
      {
        when: lastWasPcn,
        text: "Please reconsider, Warden. Walter's hospital bill arrived this morning. I'll set my watch from now on.",
      },
      {
        when: allPasses,
        text: "Thank you for the kindness yesterday. God bless you.",
      },
    ],
  },
  {
    id: "bernard-holland",
    name: "BERNARD HOLLAND",
    plate: "BH18 KAB",
    bio: "Ashbridge Cabs. Recently changed vehicles — paperwork is lagging.",
    homeStreetId: "abbeyCl",
    note: "Just dropping a fare. Out in two minutes — promise.",
    notes: [
      {
        when: lastWasPcn,
        text: "Cheers for the £80 ticket, mate. Paperwork's at DVLA — take it up with them.",
      },
      {
        when: allPasses,
        text: "Appreciate the leniency. New permit through next week, promise.",
      },
    ],
  },
  {
    id: "derek-foster",
    name: "DEREK FOSTER",
    plate: "DF22 PLM",
    bio: "Foster & Sons Plumbing. Disputes every PCN. Multiple appeals pending.",
    homeStreetId: "marketSt",
    note: "URGENT JOB. Council can take it up with my solicitor.",
    notes: [
      {
        when: lastWasPcn,
        text: "My solicitor will be in touch. Foster vs Borough of Ashbridge — see you in court.",
      },
      {
        when: allPasses,
        text: "Right answer yesterday. Don't get clever today.",
      },
    ],
  },
];

export function residentByPlate(plate: string): Resident | null {
  return RESIDENTS.find((r) => r.plate === plate) ?? null;
}

export function residentById(id: string): Resident | null {
  return RESIDENTS.find((r) => r.id === id) ?? null;
}

export function pickNote(
  resident: Resident,
  history: ResidentEncounter[],
): string | null {
  for (const v of resident.notes ?? []) {
    if (v.when(history)) return v.text;
  }
  return resident.note ?? null;
}

export type ResidentDrawCtx = {
  pool?: string[];
  chance?: number;
  rand: () => number;
};

export function maybeResident(ctx: ResidentDrawCtx): Resident | null {
  const chance = ctx.chance ?? 0;
  if (chance <= 0) return null;
  let pool: Resident[];
  if (ctx.pool === undefined) {
    pool = RESIDENTS;
  } else if (ctx.pool.length === 0) {
    return null;
  } else {
    pool = RESIDENTS.filter((r) => ctx.pool!.includes(r.id));
  }
  if (!pool.length) return null;
  if (ctx.rand() >= chance) return null;
  const idx = Math.floor(ctx.rand() * pool.length);
  return pool[idx] ?? null;
}
