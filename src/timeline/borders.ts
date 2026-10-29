// Which border change is in force on a date (SPEC §4 MapCanvas): pure, so it can be unit tested.

interface Change {
  polity: string;
  effective: { iso: string };
}

/** "1900" and "1900-05" sort as the first day of that period, so mixed precisions compare. */
export const dayKey = (iso: string): string =>
  iso.length === 4 ? `${iso}-01-01` : iso.length === 7 ? `${iso}-01` : iso;

/**
 * Per polity, the latest change whose effective date is not later than `iso`. A polity with no
 * change yet is absent: nothing is drawn for it (A14: what has no source stays blank).
 */
export function activeBorderChanges<T extends Change>(changes: readonly T[], iso: string): T[] {
  const today = dayKey(iso);
  const latest = new Map<string, T>();
  for (const change of changes) {
    if (dayKey(change.effective.iso) > today) continue;
    const held = latest.get(change.polity);
    if (!held || dayKey(held.effective.iso) < dayKey(change.effective.iso)) {
      latest.set(change.polity, change);
    }
  }
  return [...latest.values()];
}
