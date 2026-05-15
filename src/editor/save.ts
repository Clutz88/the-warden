import type { DayDefRaw, Street } from "../game/types";
import type { Resident } from "../game/residents";

export type SaveResult = { ok: true; file: string } | { ok: false; error: string };

export async function saveDay(day: number, raw: DayDefRaw): Promise<SaveResult> {
  return post("/__editor/save", { day, raw });
}

export async function saveResidents(residents: Resident[]): Promise<SaveResult> {
  return post("/__editor/save-residents", { residents });
}

export async function saveStreets(streets: Street[]): Promise<SaveResult> {
  return post("/__editor/save-streets", { streets });
}

async function post(url: string, body: unknown): Promise<SaveResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; file?: string; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, file: data.file ?? "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
