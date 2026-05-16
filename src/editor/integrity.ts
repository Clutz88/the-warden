// Cross-file referential integrity checks for the editor's drafts.
//
// The editor has live drafts for the day being edited (s.draft), all residents
// (s.residentsDraft) and all streets (s.streetsDraft). Other days are read from
// disk via RAW_DAYS. To predict what would break after a save, we evaluate every
// day's references against the current drafts of residents/streets, and use
// s.draft for the currently-edited day (since its unsaved changes would land too).

import type { DayDefRaw } from "../game/types";
import type { EditorState } from "./state";

export type IntegrityIssue = {
  scope: string;
  message: string;
};

export type DayLookup = (dayNum: number) => DayDefRaw | undefined;

/** Find references that would be broken if the current drafts were saved. */
export function findBrokenRefs(s: EditorState, dayNumbers: number[], rawDayLookup: DayLookup): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const validStreetIds = new Set(s.streetsDraft.map((x) => x.id));
  const validResidentIds = new Set(s.residentsDraft.map((x) => x.id));

  for (const dayNum of dayNumbers) {
    // For the currently edited day, use the live draft (its unsaved changes
    // would land too). For every other day, use RAW_DAYS.
    const day =
      s.mode === "day" && s.day === dayNum ? s.draft : rawDayLookup(dayNum);
    if (!day) continue;

    for (const sid of day.streets) {
      if (!validStreetIds.has(sid)) {
        issues.push({
          scope: `Day ${dayNum}`,
          message: `streets[] references missing street "${sid}"`,
        });
      }
    }

    for (const car of day.cars) {
      if (!validStreetIds.has(car.street)) {
        issues.push({
          scope: `Day ${dayNum}`,
          message: `car ${car.plate} references missing street "${car.street}"`,
        });
      }
      if (car.residentId && !validResidentIds.has(car.residentId)) {
        issues.push({
          scope: `Day ${dayNum}`,
          message: `car ${car.plate} references missing resident "${car.residentId}"`,
        });
      }
    }
  }

  return issues;
}
