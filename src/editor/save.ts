import type { DayDefRaw } from "../game/types";

export async function saveDay(day: number, raw: DayDefRaw): Promise<{ ok: true; file: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/__editor/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, raw }),
    });
    const body = (await res.json()) as { ok?: boolean; file?: string; error?: string };
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, file: body.file ?? "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
