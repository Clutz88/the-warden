export type Resident = {
  id: string;
  name: string;
  plate: string;
  bio: string;
  homeStreetId?: string;
};

export const RESIDENTS: Resident[] = [];

export function residentByPlate(plate: string): Resident | null {
  return RESIDENTS.find((r) => r.plate === plate) ?? null;
}

export function residentById(id: string): Resident | null {
  return RESIDENTS.find((r) => r.id === id) ?? null;
}

export type ResidentDrawCtx = {
  pool?: string[];
  chance?: number;
  rand: () => number;
};

export function maybeResident(ctx: ResidentDrawCtx): Resident | null {
  const chance = ctx.chance ?? 0;
  if (chance <= 0) return null;
  const pool = ctx.pool && ctx.pool.length
    ? RESIDENTS.filter((r) => ctx.pool!.includes(r.id))
    : RESIDENTS;
  if (!pool.length) return null;
  if (ctx.rand() >= chance) return null;
  const idx = Math.floor(ctx.rand() * pool.length);
  return pool[idx] ?? null;
}
