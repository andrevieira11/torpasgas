/**
 * Consumption math. Pure — no DB, no dates constructed. All inputs are integers
 * (cents / millilitres / km); outputs are numbers formatted only at the UI edge.
 *
 * L/100km is only knowable between two FULL fill-ups: the tank is at the same
 * level at both ends, so the fuel added in between (partials + the closing full)
 * is exactly what the km in between consumed. Partial fills therefore never
 * produce their own segment — they roll into the next full one.
 */

export type FillupInput = {
  id: string;
  fillDate: string; // "YYYY-MM-DD"
  odometerKm: number;
  litersMl: number;
  totalCents: number;
  isFull: boolean;
};

export type Segment = {
  /** Fill-up that closes the segment (its date locates the segment in time). */
  endId: string;
  endDate: string;
  km: number;
  litersMl: number;
  totalCents: number;
  l100: number;
};

export type FuelStats = {
  /** Weighted overall average across all segments; null until 2 full fill-ups exist. */
  avgL100: number | null;
  /** Weighted average €/L across every fill-up. */
  avgPricePerLiter: number | null;
  /** €/100km across segments (fuel actually attributed to driven km). */
  costPer100Km: number | null;
  totalSpentCents: number;
  totalLitersMl: number;
  /** Odometer span between first and last fill-up. */
  kmTracked: number;
};

/** Sort by odometer, ties by date then id — the physical timeline of the car. */
export function sortFillups<T extends FillupInput>(fillups: T[]): T[] {
  return [...fillups].sort(
    (a, b) =>
      a.odometerKm - b.odometerKm ||
      a.fillDate.localeCompare(b.fillDate) ||
      a.id.localeCompare(b.id),
  );
}

/**
 * Build consumption segments between consecutive FULL fill-ups. The opening
 * fill-up of a segment contributes only its odometer (its fuel was burned in the
 * *previous* stretch); every fill-up after it up to and including the closing
 * full one contributes fuel and cost.
 */
export function buildSegments(fillups: FillupInput[]): Segment[] {
  const ordered = sortFillups(fillups);
  const segments: Segment[] = [];

  let anchorOdo: number | null = null; // odometer of the last FULL fill-up
  let litersMl = 0;
  let totalCents = 0;

  for (const f of ordered) {
    if (anchorOdo !== null) {
      litersMl += f.litersMl;
      totalCents += f.totalCents;
      if (f.isFull) {
        const km = f.odometerKm - anchorOdo;
        if (km > 0) {
          segments.push({
            endId: f.id,
            endDate: f.fillDate,
            km,
            litersMl,
            totalCents,
            l100: (litersMl / 1000 / km) * 100,
          });
        }
      }
    }
    if (f.isFull) {
      anchorOdo = f.odometerKm;
      litersMl = 0;
      totalCents = 0;
    }
  }
  return segments;
}

export function computeStats(fillups: FillupInput[]): FuelStats {
  const ordered = sortFillups(fillups);
  const segments = buildSegments(ordered);

  const totalSpentCents = ordered.reduce((s, f) => s + f.totalCents, 0);
  const totalLitersMl = ordered.reduce((s, f) => s + f.litersMl, 0);
  const kmTracked =
    ordered.length >= 2
      ? ordered[ordered.length - 1].odometerKm - ordered[0].odometerKm
      : 0;

  const segKm = segments.reduce((s, x) => s + x.km, 0);
  const segMl = segments.reduce((s, x) => s + x.litersMl, 0);
  const segCents = segments.reduce((s, x) => s + x.totalCents, 0);

  return {
    avgL100: segKm > 0 ? (segMl / 1000 / segKm) * 100 : null,
    avgPricePerLiter:
      totalLitersMl > 0 ? totalSpentCents / 100 / (totalLitersMl / 1000) : null,
    costPer100Km: segKm > 0 ? (segCents / 100 / segKm) * 100 : null,
    totalSpentCents,
    totalLitersMl,
    kmTracked,
  };
}

export type MonthSpend = { month: string; totalCents: number };

/** Spend per "YYYY-MM", ascending, gaps filled with zero between first and last. */
export function spendByMonth(fillups: FillupInput[]): MonthSpend[] {
  if (fillups.length === 0) return [];
  const map = new Map<string, number>();
  for (const f of fillups) {
    const ym = f.fillDate.slice(0, 7);
    map.set(ym, (map.get(ym) ?? 0) + f.totalCents);
  }
  const months = [...map.keys()].sort();
  const out: MonthSpend[] = [];
  let [y, m] = months[0].split("-").map(Number);
  const last = months[months.length - 1];
  let ym = months[0];
  while (ym <= last) {
    out.push({ month: ym, totalCents: map.get(ym) ?? 0 });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    ym = `${y}-${String(m).padStart(2, "0")}`;
  }
  return out;
}

export type MonthConsumption = { month: string; l100: number };

/**
 * Weighted average L/100km per month. A segment lands in the month of its
 * closing fill-up. Months without a closed segment are skipped (no data ≠ zero).
 */
export function consumptionByMonth(fillups: FillupInput[]): MonthConsumption[] {
  const acc = new Map<string, { km: number; ml: number }>();
  for (const s of buildSegments(fillups)) {
    const ym = s.endDate.slice(0, 7);
    const cur = acc.get(ym) ?? { km: 0, ml: 0 };
    cur.km += s.km;
    cur.ml += s.litersMl;
    acc.set(ym, cur);
  }
  return [...acc.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { km, ml }]) => ({ month, l100: (ml / 1000 / km) * 100 }));
}

export type MonthPartSpend = { part: string; totalCents: number };

/** Spend by part of the month (days 1–10 / 11–20 / 21–31), across all fill-ups. */
export function spendByMonthPart(fillups: FillupInput[]): MonthPartSpend[] {
  const parts = [
    { part: "1–10", totalCents: 0 },
    { part: "11–20", totalCents: 0 },
    { part: "21–31", totalCents: 0 },
  ];
  for (const f of fillups) {
    const day = Number(f.fillDate.slice(8, 10));
    const idx = day <= 10 ? 0 : day <= 20 ? 1 : 2;
    parts[idx].totalCents += f.totalCents;
  }
  return parts;
}

/**
 * Per-row enrichment for the history list: €/L always; L/100km on the rows that
 * close a segment.
 */
export function enrichForList<T extends FillupInput>(fillups: T[]) {
  const byEndId = new Map(buildSegments(fillups).map((s) => [s.endId, s]));
  return sortFillups(fillups)
    .reverse() // newest first for display
    .map((f) => ({
      ...f,
      segment: byEndId.get(f.id) ?? null,
    }));
}
