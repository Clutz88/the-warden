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
  {
    id: "priya-shah",
    name: "PRIYA SHAH",
    plate: "PS19 RUN",
    bio: "Marathon runner. Trains before work. Always 'just five more minutes'.",
    homeStreetId: "victoriaTerr",
    note: "Cooling down after a 10K. Be back before the meter strip changes.",
    notes: [
      {
        when: lastWasPcn,
        text: "Fair cop. New PB this morning though, so I'll forgive you.",
      },
    ],
  },
  {
    id: "elsie-whittaker",
    name: "ELSIE WHITTAKER",
    plate: "K194 ELS",
    bio: "Retired schoolteacher. Drives a 1995 Vauxhall Astra she calls 'the old girl'.",
    homeStreetId: "abbeyCl",
    note: "Just collecting my prescription from Boots. Knees aren't what they were.",
  },
  {
    id: "owen-pritchard",
    name: "OWEN PRITCHARD",
    plate: "OP66 WLN",
    bio: "Welsh, retired bus driver. Takes pride in parking precisely between the lines.",
    homeStreetId: "abbeyCl",
    note: "Pop in for a paper. Two minutes, mun.",
  },
  {
    id: "fatima-rahman",
    name: "FATIMA RAHMAN",
    plate: "FR70 MED",
    bio: "Junior doctor at St. Hilda's. Night shift hours; perpetually behind on permit renewal.",
    homeStreetId: "victoriaTerr",
    note: "Off a 12-hour shift. Permit renewal in the post — please bear with me.",
    notes: [
      {
        when: lastWasPcn,
        text: "I worked till 6am. Surely there's some grace for nurses and doctors?",
      },
    ],
  },
  {
    id: "jaime-okafor",
    name: "JAIME OKAFOR",
    plate: "LRZ 4421",
    bio: "Visiting from Belfast. House-sitting for his sister on Abbey Close.",
    homeStreetId: "abbeyCl",
    note: "NI plates — please don't ticket. I'm just visiting family.",
  },
  {
    id: "stuart-mclean",
    name: "STUART McLEAN",
    plate: "SM21 GLA",
    bio: "Drives down from Glasgow every Tuesday for his daughter's recorder lesson.",
    homeStreetId: "marketSt",
    note: "From up the road. Lass has her grade three exam Friday.",
  },
  {
    id: "tomasz-kowalski",
    name: "TOMASZ KOWALSKI",
    plate: "TK18 BLD",
    bio: "Builder. Van full of plasterboard. Job at number 14 Church Lane.",
    homeStreetId: "churchLn",
    note: "Building merchants close at 4. Ten minutes, then I'm gone.",
    notes: [
      {
        when: lastWasPcn,
        text: "Ten minutes I said. Council loves a small contractor, eh?",
      },
    ],
  },
  {
    id: "agnes-bellweather",
    name: "AGNES BELLWEATHER",
    plate: "ABC 873L",
    bio: "Eighty-two. Drives a 1971 Morris Minor. Her late husband's pride and joy.",
    homeStreetId: "abbeyCl",
    note: "I won't be a moment. Reginald always said this car would outlast me.",
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
