import residentsRaw from "./residents.json";

export type Resident = {
  id: string;
  name: string;
  plate: string;
  bio: string;
  homeStreetId?: string;
};

export const RESIDENTS: Resident[] = residentsRaw as Resident[];

export function residentByPlate(plate: string): Resident | null {
  return RESIDENTS.find((r) => r.plate === plate) ?? null;
}

export function residentById(id: string): Resident | null {
  return RESIDENTS.find((r) => r.id === id) ?? null;
}
